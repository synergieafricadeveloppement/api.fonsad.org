// backend/controllers/national/departement.global.controller.js

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

const Departement = require('../../models/national/Departement');
const Province = require('../../models/national/Province');

const getAllDepartementsGroupedByProvince = asyncHandler(async (req, res) => {
  const { status, type } = req.query;

  const match = {};

  if (status) {
    match.status = String(status).toUpperCase();
  }

  if (type) {
    match.type = String(type).trim();
  }

  const departements = await Departement.aggregate([
    {
      $match: match,
    },
    {
      $lookup: {
        from: Province.collection.name,
        localField: 'provinceId',
        foreignField: '_id',
        as: 'province',
      },
    },
    {
      $unwind: {
        path: '$province',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        code: 1,
        type: 1,
        status: 1,
        description: 1,
        responsable: 1,
        celluleId: 1,
        createdAt: 1,
        updatedAt: 1,
        provinceId: '$province._id',
        provinceName: {
          $ifNull: ['$province.name', 'Province inconnue'],
        },
        provinceCode: '$province.code',
      },
    },
    {
      $sort: {
        provinceName: 1,
        name: 1,
      },
    },
  ]);

  const groupedMap = new Map();

  for (const departement of departements) {
    const provinceKey = String(
      departement.provinceId || departement.provinceName || 'unknown'
    );

    if (!groupedMap.has(provinceKey)) {
      groupedMap.set(provinceKey, {
        provinceId: departement.provinceId || null,
        provinceName: departement.provinceName || 'Province inconnue',
        provinceCode: departement.provinceCode || '',
        departementsCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        suspendedCount: 0,
        archivedCount: 0,
        departements: [],
      });
    }

    const bucket = groupedMap.get(provinceKey);

    bucket.departements.push(departement);
    bucket.departementsCount += 1;

    const normalized = String(departement.status || 'ACTIVE').toUpperCase();

    if (normalized === 'ACTIVE') bucket.activeCount += 1;
    else if (normalized === 'INACTIVE') bucket.inactiveCount += 1;
    else if (normalized === 'SUSPENDED') bucket.suspendedCount += 1;
    else if (normalized === 'ARCHIVED') bucket.archivedCount += 1;
  }

  const provinces = Array.from(groupedMap.values()).sort((a, b) =>
    String(a.provinceName || '').localeCompare(String(b.provinceName || ''))
  );

  return res.status(200).json(
    successResponse('Départements nationaux récupérés avec succès.', {
      provinces,
      totalDepartements: departements.length,
      filters: {
        status: status || null,
        type: type || null,
      },
    })
  );
});

module.exports = {
  getAllDepartementsGroupedByProvince,
};