// backend/controllers/national/adhesion.global.controller.js

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

const MembershipRequest = require('../../models/MembershipRequest');

const getAllAdhesionsGroupedByProvince = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const match = {};

  if (status) {
    match.status = String(status).trim().toLowerCase();
  }

  const adhesions = await MembershipRequest.aggregate([
    {
      $match: match,
    },
    {
      $project: {
        _id: 1,
        fullName: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        phone: 1,
        provinceName: {
          $ifNull: ['$provinceName', 'Province inconnue'],
        },
        celluleName: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $sort: {
        provinceName: 1,
        createdAt: -1,
      },
    },
  ]);

  const groupedMap = new Map();

  for (const adhesion of adhesions) {
    const provinceKey =
      String(adhesion.provinceName || '').trim() || 'Province inconnue';

    if (!groupedMap.has(provinceKey)) {
      groupedMap.set(provinceKey, {
        provinceName: provinceKey,
        adhesionsCount: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        adhesions: [],
      });
    }

    const bucket = groupedMap.get(provinceKey);
    const normalizedStatus = String(adhesion.status || 'pending')
      .trim()
      .toLowerCase();

    bucket.adhesions.push(adhesion);
    bucket.adhesionsCount += 1;

    if (normalizedStatus === 'submitted' || normalizedStatus === 'under_review' || normalizedStatus === 'pending') {
      bucket.pendingCount += 1;
    } else if (normalizedStatus === 'approved') {
      bucket.approvedCount += 1;
    } else if (normalizedStatus === 'rejected') {
      bucket.rejectedCount += 1;
    }
  }

  const provinces = Array.from(groupedMap.values()).sort((a, b) =>
    String(a.provinceName || '').localeCompare(String(b.provinceName || ''))
  );

  return res.status(200).json(
    successResponse('Adhésions nationales récupérées avec succès.', {
      provinces,
      totalAdhesions: adhesions.length,
      filters: {
        status: status || null,
      },
    })
  );
});

module.exports = {
  getAllAdhesionsGroupedByProvince,
};