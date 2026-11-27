import type { ProductTechnicalDossier } from '../types/port';
import { DOSSIERS_CHEM_AND_OILS } from './dossiersChemSeed';
import { DOSSIERS_PEMEX_TASP } from './dossiersPemexSeed';
import { DOSSIERS_DRY_AND_ACIDS } from './dossiersDryCargoSeed';

export const COATZACOALCOS_PRODUCT_DOSSIERS: ProductTechnicalDossier[] = [
  ...DOSSIERS_CHEM_AND_OILS,
  ...DOSSIERS_PEMEX_TASP,
  ...DOSSIERS_DRY_AND_ACIDS,
];
