// backend/controllers/national/membre.global.controller.js

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

const User = require('../../models/User');

/**
 * GET /api/national/membres
 *
 * Query params optionnels :
 * - type=honneur
 * - status=actif
 *
 * Groupe les membres par provinceName.
 */
const getAllMembresGroupedByProvince = asyncHandler(async (req, res) => {
  const { type, status } = req.query;

  const filter = {
    role: { $in: ['membre', 'adherent'] },
  };

  if (type === 'honneur') {
    filter.memberType = 'honneur';
  }

  if (status === 'actif') {
    filter.isActive = true;
  }

  const membres = await User.aggregate([
    {
      $match: filter,
    },
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
        fullName: {
          $trim: {
            input: {
              $concat: [
                { $ifNull: ['$firstName', ''] },
                ' ',
                { $ifNull: ['$lastName', ''] },
              ],
            },
          },
        },
        email: 1,
        phone: 1,
        level: 1,
        department: 1,
        role: 1,
        memberType: 1,
        provinceName: 1,
        celluleName: 1,
        emailVerified: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $sort: {
        provinceName: 1,
        fullName: 1,
      },
    },
  ]);

  const groupedMap = new Map();

  for (const membre of membres) {
    const provinceKey =
      String(membre.provinceName || '').trim() || 'Province inconnue';

    if (!groupedMap.has(provinceKey)) {
      groupedMap.set(provinceKey, {
        provinceName: provinceKey,
        membresCount: 0,
        membresActifsCount: 0,
        membresHonneurCount: 0,
        membres: [],
      });
    }

    const bucket = groupedMap.get(provinceKey);

    bucket.membres.push(membre);
    bucket.membresCount += 1;

    if (membre.isActive === true) {
      bucket.membresActifsCount += 1;
    }

    if (membre.memberType === 'honneur') {
      bucket.membresHonneurCount += 1;
    }
  }

  const provinces = Array.from(groupedMap.values()).sort((a, b) =>
    String(a.provinceName || '').localeCompare(String(b.provinceName || ''))
  );

  return res.status(200).json(
    successResponse('Membres nationaux récupérés avec succès.', {
      provinces,
      totalMembres: membres.length,
      filters: {
        type: type || null,
        status: status || null,
      },
    })
  );
});

module.exports = {
  getAllMembresGroupedByProvince,
};