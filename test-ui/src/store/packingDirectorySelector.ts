import { RootState } from './store';

export const selectPackingDirectory = (state: RootState) => state.tests.packingDirectory;
export const selectIsPacking = (state: RootState) => state.tests.isPacking;
export const selectLocalPackagePath = (state: RootState) => state.tests.localPackagePath;
