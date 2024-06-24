/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import React, { useState, useEffect, useCallback } from "react";
import { formatAsset, formatAssetAmount, shortenAddress } from "../utils";
import { useLiquity } from "../hooks/LiquityContext";
// import { Icon } from "./Icon";
// import { LoadingOverlay } from "./LoadingOverlay";
// import { Abbreviation } from "./Abbreviation";
import { useLang } from "../hooks/useLang";
import { IOTX, WEN } from "../libs/globalContants";
import appConfig from "../appConfig.json";
import { JsonObject, LiquidatableTrove } from "../libs/types";
import { TxDone } from "./TxDone";
import { TxLabel } from "./TxLabel";
import { Vault } from "../libs/Vault";
import { magma } from "../libs/magma";

type RiskyTrovesProps = {
  pageSize: number;
  constants?: Record<string, any> | any;
  refreshTrigger: () => void;
};

// const select = ({
//   price,
//   total,
//   blockTag
// }: BlockPolledLiquityStoreState) => ({
//   price,
//   recoveryMode: total.collateralRatioIsBelowCritical(price),
//   totalCollateralRatio: total.collateralRatio(price),
//   blockTag
// });

export const RiskyTroves: React.FC<RiskyTrovesProps> = ({ pageSize, constants }) => {
  if (!constants) return <></>

  const { t } = useLang();
  const {
    recoveryMode,
    totalCollateralRatio,
    price
  } = constants; // useLiquitySelector(select);
  const factor = 0.95;
  const { chainId, publicClient } = useLiquity();
  const [loading, setLoading] = useState(true);
  // const [troves, setTroves] = useState<UserTrove[]>();
  // const [vaults, setVaults] = useState<Vault[]>([]);
  // const [reload, setReload] = useState(false);
  const [page, setPage] = useState(0);
  const appConfigConstants = (appConfig.constants as JsonObject)[String(chainId)];
  // const mcr = constants?.MCR?.gt(0) ? constants.MCR : Decimal.from((appConfig.constants as JsonObject)[String(chainId)].MAGMA_MINIMUM_COLLATERAL_RATIO);
  const mcr = constants?.MCR > 0 ? constants?.MCR : appConfigConstants.MAGMA_MINIMUM_COLLATERAL_RATIO;
  // const [fromIndex, setFromIndex] = useState(0);
  // const [previousBatchCount, setPreviousBatchCount] = useState(0);
  const [liquidatableVaults, setLiquidatableVaults] = useState<LiquidatableTrove[]>([]);
  const numberOfTroves = liquidatableVaults?.length || 0;
  const numberOfPages = Math.ceil(numberOfTroves / pageSize) || 1;
  const clampedPage = Math.min(page, numberOfPages - 1);
  // const [resetTx, setResetTx] = useState(false);
  // const txId = useMemo(() => String(new Date().getTime()), [resetTx]);
  // const [transactionState, setTransactionState] = useTransactionState();
  const [showTxDone, setShowTxDone] = useState(false);
  const [txAmount, setTxAmount] = useState("");
  const [txHash, setTxHash] = useState("");

  // const nextPage = () => {
  //   if (clampedPage < numberOfPages - 1) {
  //     setPage(clampedPage + 1);
  //   }
  // };

  // const previousPage = () => {
  //   if (clampedPage > 0) {
  //     setPage(clampedPage - 1);
  //   }
  // };

  useEffect(() => {
    if (page !== clampedPage) {
      setPage(clampedPage);
    }
  }, [page, clampedPage]);

  const pickUpLiquidatableVault = useCallback((vs: Vault[]) => {
    const tempArr: LiquidatableTrove[] = [];

    vs?.forEach(vault => {
      const collateralRatio = vault.collateralRatio(price);

      // (vault as LiquidatableTrove).liquidatable = true; // for testing.
      // return tempArr.push(vault as LiquidatableTrove); // for testing.

      if (recoveryMode) {
        if (collateralRatio > mcr && collateralRatio < totalCollateralRatio) {
          (vault as LiquidatableTrove).liquidatable = true;
          tempArr.push(vault as LiquidatableTrove);
        }
      } else {
        if (collateralRatio < mcr / factor) {
          tempArr.push(vault as LiquidatableTrove);

          if (collateralRatio < mcr) (vault as LiquidatableTrove).liquidatable = true;
        }
      }
    });

    return tempArr;
  }, [mcr, price, recoveryMode, totalCollateralRatio]);

  const fetchVaults = useCallback((from = 0) => {
    magma.getVaults(false, from, vs => {
      // setPreviousBatchCount(vs?.length);
      // setVaults(vs);
      // setLoading(false);

      const tempVaults = pickUpLiquidatableVault(vs);
      setLiquidatableVaults([...liquidatableVaults, ...tempVaults]);

      setTimeout(() => {
        if (liquidatableVaults.length < 20 && vs?.length === 100) {
          fetchVaults(from + 1);
        } else {
          setLoading(false);
        }
      }, 1000);
    });
  }, [pickUpLiquidatableVault]);

  useEffect(() => {
    setLoading(true);
    fetchVaults(0);
  }, [fetchVaults]);

  // useEffect(() => {
  //   let mounted = true;

  //   setLoading(true);

  //   liquity
  //     .getTroves(
  //       {
  //         first: pageSize,
  //         sortedBy: "ascendingCollateralRatio",
  //         startingAt: clampedPage * pageSize
  //       },
  //       { blockTag }
  //     )
  //     .then(troves => {
  //       if (mounted) {
  //         setTroves(troves);
  //         setLoading(false);
  //       }
  //     });

  //   return () => {
  //     mounted = false;
  //   };
  //   // Omit blockTag from deps on purpose
  //   // eslint-disable-next-line
  // }, [liquity, clampedPage, pageSize, reload, numberOfTroves]);

  // const waitForConfirmation = async () => {
  //   const id = transactionState.type !== "idle" ? transactionState.id : undefined;
  //   const tx = (transactionState.type === "waitingForConfirmation" || transactionState.type === "confirmedOneShot") ? transactionState.tx : undefined;

  //   if (!id || !tx) return;

  //   const hash = tx?.rawSentTransaction as unknown as string;

  //   setTxHash(hash);

  //   const callMyself = () => setTimeout(() => {
  //     waitForConfirmation();
  //   }, 5000);

  //   try {
  //     const receipt = await provider.getTransactionReceipt(hash);
  //     if (!receipt) {
  //       return callMyself();
  //     }

  //     if (receipt.status === 1) {
  //       if (transactionState.type === "confirmedOneShot" && id) {
  //         return setTransactionState({ type: "confirmed", id });
  //       }

  //       setTransactionState({
  //         type: "confirmedOneShot",
  //         id,
  //         tx
  //       });

  //       return callMyself();
  //     } else {
  //       const reason = await tryToGetRevertReason(provider, receipt);

  //       console.error(`Tx ${hash} failed`);
  //       if (reason) {
  //         console.error(`Revert reason: ${reason}`);
  //       }

  //       setTransactionState({
  //         type: "failed",
  //         id,
  //         error: new Error(reason ? `Reverted: ${reason}` : "Failed")
  //       });
  //     }
  //   } catch (rawError) {
  //     console.warn(rawError);
  //   }
  // };

  const handleLiquidate = (evt: React.MouseEvent<HTMLButtonElement>) => {
    // const owner = evt.currentTarget.id;
    // const send = liquity.send.liquidate.bind(liquity.send, owner)
    // const id = txId;

    setTxAmount(evt.currentTarget.dataset.amount!);

    magma.liquidate(
      undefined,
			undefined,
			undefined
    );
  };

  const handleCloseTxDone = () => {
    setShowTxDone(false);
    setTxHash("");
    setTxAmount("");
  };

  // 交易结束或失败后重置transactionState。
  // useEffect(() => {
  //   if (transactionState.id === txId && transactionState.type === "waitingForConfirmation") {
  //     waitForConfirmation();
  //   }

  //   if (transactionState.id === txId && (transactionState.type === "failed" || transactionState.type === "cancelled")) {
  //     setTransactionState({ type: "idle" });
  //     setResetTx(!resetTx);
  //   }

  //   if (transactionState.id === txId && (transactionState.type === "confirmed")) {
  //     setReload(!reload);
  //     setShowTxDone(true);
  //   }
  // }, [transactionState.id, transactionState.type, txId])


  return <>
    {/* {loading && <LoadingOverlay />} */}

    {!loading && <div style={{ width: "100%" }}>
      <div className="flex-row-space-between">
        <h3>{t("riskyTroves")}</h3>
      </div>

      {liquidatableVaults && liquidatableVaults.length > 0 && <div className="table">
        <div className="tableBody">
          {liquidatableVaults.map((vault: LiquidatableTrove, idx: number) => {
            return <div
              className="tableRow"
              key={vault.owner}>
              <div className="tableCell">
                <div className="label">{t("owner")}</div>

                <a
                  className="textButton"
                  href={publicClient?.chain?.blockExplorers?.default.url + "/address/" + vault.owner}
                  target="_blank">
                  {shortenAddress(vault.owner)}

                  <img src="images/external-orange.png" />
                </a>
              </div>

              <div className="tableCell">
                <div className="label">{t("collateral")}</div>

                <div>{formatAsset(formatAssetAmount(vault.collateral, IOTX.decimals), IOTX)}</div>
              </div>

              <div className="tableCell">
                <div className="label">{t("debt")}</div>

                <div>{formatAsset(formatAssetAmount(vault.debt, WEN.decimals), WEN)}</div>
              </div>

              <div className="tableCell">
                <div className="label">{t("utilizationRate")}</div>

                <div>{((1 / vault.collateralRatio(price)) * 100).toFixed()}%</div>
              </div>

              <div className="tableCell">
                <button
                  data-amount={vault.collateral.toString()}
                  id={String(idx)}
                  className="secondaryButton"
                  onClick={handleLiquidate}
                  disabled={!vault.liquidatable}>
                  {t("liquidate")}
                </button>
              </div>
            </div>
          }
          )}
        </div>
      </div>}

      {liquidatableVaults?.length === 0 && <p className="description">{t("noLiquidatableTrove")}</p>}

      {/* <div className="paging">
        {numberOfTroves !== 0 && <>
          <Abbreviation
            short={`page ${clampedPage + 1} / ${numberOfPages}`}
            sx={{ mr: [0, 3], fontWeight: "body", fontSize: [1, 2], letterSpacing: [-1, 0] }}>
            {clampedPage * pageSize + 1}-{Math.min((clampedPage + 1) * pageSize, numberOfTroves)}{" "}
            of {numberOfTroves}
          </Abbreviation>

          <button
            className="textButton"
            onClick={previousPage}
            disabled={clampedPage <= 0}>
          </button>

          <span>&nbsp;&nbsp;</span>

          <button
            className="textButton"
            onClick={nextPage}
            disabled={clampedPage >= numberOfPages - 1}>
          </button>
        </>}
      </div> */}
    </div>}

    {showTxDone && <TxDone
      title={t("liquidatedSuccessfully")}
      onClose={handleCloseTxDone}
      illustration="images/general-success.png"
      whereGoBack={t("back2RiskyVault")}>
      <TxLabel
        txHash={txHash}
        title={t("liquidatedAmount")}
        logo={IOTX.logo}
        amount={txAmount + " " + IOTX.symbol} />
    </TxDone>}
  </>;
};
