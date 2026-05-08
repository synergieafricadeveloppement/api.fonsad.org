// backend/controllers/national/finance.global.controller.js

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');

const Finance = require('../../models/national/Finance');
const Province = require('../../models/national/Province');

const getAllFinancesGroupedByProvince = asyncHandler(async (req, res) => {
  const { type, devise } = req.query;

  const match = {};

  if (type) {
    match.type = String(type).trim().toUpperCase();
  }

  if (devise) {
    match.devise = String(devise).trim().toUpperCase();
  }

  const finances = await Finance.aggregate([
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
        libelle: 1,
        type: 1,
        montant: 1,
        devise: 1,
        dateOperation: 1,
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
        dateOperation: -1,
      },
    },
  ]);

  const groupedMap = new Map();

  for (const finance of finances) {
    const provinceKey = String(
      finance.provinceId || finance.provinceName || 'unknown'
    );

    if (!groupedMap.has(provinceKey)) {
      groupedMap.set(provinceKey, {
        provinceId: finance.provinceId || null,
        provinceName: finance.provinceName || 'Province inconnue',
        provinceCode: finance.provinceCode || '',
        operationsCount: 0,
        entreesCount: 0,
        sortiesCount: 0,
        totalEntrees: 0,
        totalSorties: 0,
        soldeNet: 0,
        finances: [],
      });
    }

    const bucket = groupedMap.get(provinceKey);
    const montant = Number(finance.montant || 0);
    const normalizedType = String(finance.type || '').toUpperCase();

    bucket.finances.push(finance);
    bucket.operationsCount += 1;

    if (normalizedType === 'ENTREE') {
      bucket.entreesCount += 1;
      bucket.totalEntrees += montant;
    } else if (normalizedType === 'SORTIE') {
      bucket.sortiesCount += 1;
      bucket.totalSorties += montant;
    }

    bucket.soldeNet = bucket.totalEntrees - bucket.totalSorties;
  }

  const provinces = Array.from(groupedMap.values())
    .map((item) => ({
      ...item,
      totalEntrees: Number(item.totalEntrees || 0),
      totalSorties: Number(item.totalSorties || 0),
      soldeNet: Number(item.soldeNet || 0),
    }))
    .sort((a, b) =>
      String(a.provinceName || '').localeCompare(String(b.provinceName || ''))
    );

  return res.status(200).json(
    successResponse('Finances nationales récupérées avec succès.', {
      provinces,
      totalOperations: finances.length,
      filters: {
        type: type || null,
        devise: devise || null,
      },
    })
  );
});

module.exports = {
  getAllFinancesGroupedByProvince,
};