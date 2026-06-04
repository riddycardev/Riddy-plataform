-- Deletar todos os veículos de teste
DELETE FROM vehicleImages WHERE vehicleId IN (SELECT id FROM vehicles);
DELETE FROM vehicles;
