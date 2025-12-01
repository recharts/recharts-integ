import { setPackingDirectory, setLocalPackagePath } from "../store/testsSlice";
import { AppDispatch } from "../store";

export function loadPersistedPackingDirectory(dispatch: AppDispatch) {
  try {
    const storedDirectory = localStorage.getItem("packingDirectory");
    const storedPackagePath = localStorage.getItem("localPackagePath");

    if (storedDirectory) {
      dispatch(setPackingDirectory(storedDirectory));
    }
    if (storedPackagePath) {
      dispatch(setLocalPackagePath(storedPackagePath));
    }
  } catch (err) {
    console.error("Failed to load persisted packing directory:", err);
  }
}
