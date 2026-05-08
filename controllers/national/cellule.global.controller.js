// backend/controllers/national/cellule.global.controller.js

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

const Cellule = require('../../models/national/Cellule');
const Province = require('../../models/national/Province');

const getAllCellulesGroupedByProvince = asyncHandler(async (req, res) => {
  const { status, type } = req.query;

  const match = {};

  if (status) {
    match.status = String(status).toUpperCase();
  }

  if (type) {
    match.type = String(type).trim();
  }

  const cellules = await Cellule.aggregate([
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
        commune: 1,
        zone: 1,
        address: 1,
        phone: 1,
        email: 1,
        description: 1,
        responsable: 1,
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

  for (const cellule of cellules) {
    const provinceKey = String(cellule.provinceId || cellule.provinceName || 'unknown');

    if (!groupedMap.has(provinceKey)) {
      groupedMap.set(provinceKey, {
        provinceId: cellule.provinceId || null,
        provinceName: cellule.provinceName || 'Province inconnue',
        provinceCode: cellule.provinceCode || '',
        cellulesCount: 0,
        activeCount: 0,
        inactiveCount: 0,
        suspendedCount: 0,
        archivedCount: 0,
        cellules: [],
      });
    }

    const bucket = groupedMap.get(provinceKey);

    bucket.cellules.push(cellule);
    bucket.cellulesCount += 1;

    const normalized = String(cellule.status || 'ACTIVE').toUpperCase();

    if (normalized === 'ACTIVE') bucket.activeCount += 1;
    else if (normalized === 'INACTIVE') bucket.inactiveCount += 1;
    else if (normalized === 'SUSPENDED') bucket.suspendedCount += 1;
    else if (normalized === 'ARCHIVED') bucket.archivedCount += 1;
  }

  const provinces = Array.from(groupedMap.values()).sort((a, b) =>
    String(a.provinceName || '').localeCompare(String(b.provinceName || ''))
  );

  return res.status(200).json(
    successResponse('Cellules nationales récupérées avec succès.', {
      provinces,
      totalCellules: cellules.length,
      filters: {
        status: status || null,
        type: type || null,
      },
    })
  );
});

module.exports = {
  getAllCellulesGroupedByProvince,
};