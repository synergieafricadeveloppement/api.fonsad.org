// backend/controllers/national/departement.controller.js

const asyncHandler = require('../../middlewares/asyncHandler');
const { successResponse } = require('../../utils/apiResponse');
const departementService = require('../../services/departement.service');

const getDepartementsByCellule = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;

  const departements = await departementService.listDepartementsByCellule(
    provinceId,
    celluleId
  );

  return res.status(200).json(
    successResponse('Départements récupérés avec succès.', {
      departements,
    })
  );
});

const createDepartement = asyncHandler(async (req, res) => {
  const { provinceId, celluleId } = req.params;
  const userId = req.user?.id || undefined;

  const departement = await departementService.createDepartement(
    provinceId,
    celluleId,
    req.body,
    { userId }
  );

  return res.status(201).json(
    successResponse('Département créé avec succès.', {
      departement,
    })
  );
});

const getDepartementDetail = asyncHandler(async (req, res) => {
  const { departementId } = req.params;

  const departement = await departementService.getDepartementById(departementId);

  return res.status(200).json(
    successResponse('Détail du département récupéré avec succès.', {
      departement,
    })
  );
});

module.exports = {
  getDepartementsByCellule,
  createDepartement,
  getDepartementDetail,
};