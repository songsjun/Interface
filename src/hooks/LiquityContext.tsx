import React, { createContext, useContext, useEffect, useState } from "react";
import { BaseProvider, JsonRpcSigner } from "@ethersproject/providers";
import { PublicClient, WalletClient, useAccount, useChainId, usePublicClient, useWalletClient } from "wagmi";
import { useEthersProvider, useEthersSigner } from "../libs/ethers";
import { VoidSigner, ethers } from "ethers";
import { globalContants } from "../libs/globalContants";
import { graphqlAsker } from "../libs/graphqlAsker";
import { zeroAddress } from "viem";

type LiquityContextValue = {
  account: string | undefined;
  chainId: number;
  publicClient?: PublicClient;
  urlSearch?: string;
  signer: ethers.Signer | undefined | JsonRpcSigner;
  frontendTag: string;
  walletClient: WalletClient;
};

const LiquityContext = createContext<LiquityContextValue | undefined>(undefined);

type LiquityProviderProps = {
  children: React.ReactNode;
  loader?: React.ReactNode;
};

export const LiquityProvider: React.FC<LiquityProviderProps> = ({
  children,
  loader
}) => {
  const { isConnected, address } = useAccount();
  const signer = useWalletClient();
  const chainId = useChainId();
  const wagmiProvider = useEthersProvider();
  const wagmiSinger = useEthersSigner();
  const publicClient = usePublicClient({ chainId });
  const url = new URL(window.location.href);
  const urlSearch = url.search || "";
  const refParam = url.searchParams.get("ref");
  const testAccount = url.searchParams.get("testacc"); // 用参数中的其它地址进行测试。
  const addr = isConnected ? (testAccount ?? address) : globalContants.ADDRESS_PLACEHOLDER;
  let customProvider: BaseProvider | undefined;
  let customSigner: VoidSigner | undefined;
  if (!isConnected) {
    // 在未连接钱包的情况下，强制连接默认网络。
    customProvider = ethers.getDefaultProvider(globalContants.default_NETWORK_RPC);
    customSigner = new ethers.VoidSigner(globalContants.ADDRESS_PLACEHOLDER, customProvider);
  }
  const provider = isConnected ? wagmiProvider : customProvider;
  const signerData = isConnected ? signer.data : customSigner;
  const [frontendTag, setFrontendTag] = useState(zeroAddress);
  useEffect(() => {
    if (!refParam || chainId === 0) return;

    const query = graphqlAsker.requestRefererWithCode(refParam)
    graphqlAsker.ask(chainId, query, (data: any) => {
      if (data?.frontends?.length > 0) {

        const ref = data?.frontends[0].owner.id;
        setFrontendTag(ref);
        window.config = {
          ...window.config,
          frontendTag: ref
        };
      }
    });
  }, [refParam, chainId]);

  if (isConnected && (!provider || !signerData || !addr)) {
    return <>{loader}</>;
  }

  return <LiquityContext.Provider
    value={{
      account: addr,
      chainId,
      publicClient,
      urlSearch,
      signer: wagmiSinger,
      frontendTag,
      walletClient: signer.data as WalletClient
    }}>
    {children}
  </LiquityContext.Provider>
};

export const useLiquity = () => {
  const liquityContext = useContext(LiquityContext);

  if (!liquityContext) {
    throw new Error("You must provide a LiquityContext via LiquityProvider");
  }

  return liquityContext;
};
