import { useEffect, useState } from "react";
import { useAppDispatch } from "../store/hooks";
import { loadTests } from "./useLoadTests";
import { loadPersistedResultsFromStorage } from "./useLoadPersistedResults";
import { loadRechartsVersions } from "./useLoadRechartsVersions";
import { loadPersistedPackingDirectory } from "./useLoadPersistedPackingDirectory";
import { loadVersions } from "./useLoadVersions";

export function useLoadAllInfo() {
  const dispatch = useAppDispatch();
  const [versions, setVersions] = useState<{
    node: string;
    npm: string;
    yarn: string;
    pnpm: string;
  } | null>(null);

  useEffect(() => {
    loadTests(dispatch);
    loadPersistedResultsFromStorage(dispatch);
    loadRechartsVersions(dispatch);
    loadPersistedPackingDirectory(dispatch);
    loadVersions(setVersions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { versions };
}
