import styles from "../styles/Home.module.css";
import NFTCard from "./NFTCard";
import axios from "axios";
import nftAbi from "../constants/BasicNft.json";
import nftMarketplaceAbi from "../constants/NftMarketplace.json";
import networkMapping from "../constants/networkMapping.json";
import { useMoralis, useWeb3Contract } from "react-moralis";
import { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import { ethers } from "ethers";

export default function Collection() {
  const { chainId, account, isWeb3Enabled, Moralis, network } = useMoralis();

  const [nftList, setNftList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updateCancel, setUpdateCancel] = useState("update");
  let chainString = chainId ? parseInt(chainId, 16).toString() : "31337";
  const marketplaceAddress =
    chainString in networkMapping
      ? networkMapping[chainString].NftMarketplace[
          networkMapping[chainString].NftMarketplace.length - 1
        ]
      : "";

  const { runContractFunction } = useWeb3Contract();

  const handleSuccess = () => {
    setUpdateCancel((state) => {
      console.log("heyy");
      console.log(state, " <<<< STATE!");
      const newData = state + "1";
      return newData;
    });
  };

  async function getListData() {
    if (isWeb3Enabled) {
      setLoading(true);
      const listOptions = {
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: "getCompleteListing",
        params: {},
      };

      const listData = await runContractFunction({
        params: listOptions,
        onSuccess: () => console.log("Success!"),
        onError: (error) => console.log(error, " !!!!<<<"),
      });

      if (listData) {
        let temp = listData;
        const result = [];
        for (let tempData of temp) {
          const tokenURI = await runContractFunction({
            params: {
              abi: nftAbi,
              contractAddress: tempData.nftAddress,
              functionName: "tokenURI",
              params: {
                tokenId: tempData.tokenId,
              },
              onSuccess: () => console.log("success!"),
              onError: (error) => {
                console.log(error);
              },
            },
          });

          const requestURL = tokenURI.replace(
            "ipfs://",
            "https://ipfs.io/ipfs/"
          );
          const tokenURIResponse = await (await fetch(requestURL)).json();
          const imageURI = tokenURIResponse.image;
          const imageURIURL = imageURI.replace(
            "ipfs://",
            "https://ipfs.io/ipfs/"
          );
          const tempObject = {
            imageUrl: imageURIURL,
            tokenName: tokenURIResponse.name,
            tokenDescription: tokenURIResponse.description,
          };

          tempData = {
            ...tempData,
            ...tempObject,
          };
          result.push(tempData);
        }
        setNftList(
          result.filter((data) => {
            return data.price.toString() !== "0";
          })
        );
      }
      setLoading(false);
    }
    console.log(nftList, "???? NFT LIST??");
    // const url = "https://server-nft-marketplace.herokuapp.com/getActiveItems";
    // try {
    //   const response = await axios({ url, method: "GET" });
    //   if (response.status === 200) {
    //     setLoading(false);
    //     console.log(response, " <<<<");
    //     setNftList(response.data);
    //   } else {
    //     setLoading(false);
    //   }
    // } catch (e) {
    //   setLoading(false);
    //   console.log(e);
    // }
  }
  useEffect(() => {
    if (isWeb3Enabled && nftList.length === 0) {
      if (parseInt(chainId, 16).toString() in networkMapping) {
        if (marketplaceAddress !== "") {
          getListData();
        }
      } else {
        setNftList([]);
      }
    }
  }, [isWeb3Enabled, account, chainId]);

  useEffect(() => {
    if (isWeb3Enabled) {
      if (parseInt(chainId, 16).toString() in networkMapping) {
        if (marketplaceAddress !== "") {
          getListData();
        }
      }
    }
    // Moralis.onChainChanged((chain) => {
    //   const hexadecimal = parseInt(chainId, 16);
    //   chainString = hexadecimal.toString();
    //   if (chainString in networkMapping) {
    //     if (marketplaceAddress !== '') {
    //       getListData();
    //     }
    //   } else {
    //     setNftList([]);
    //   }
    // });
  }, [updateCancel]);

  return (
    <div className={styles.collection}>
      <p className={styles.collectionTitle}>NFT Collections!</p>
      <p className={styles.collectionDescription}>
        A platform for buying and selling NFTs!
      </p>
      <div
        className={
          chainString in networkMapping === false || loading || !account
            ? ""
            : nftList.length
            ? styles.nftContainer
            : ""
        }
      >
        {chainString in networkMapping === false ? (
          <p>
            Please connect to Goerli Testnet to see NFTs in this marketplace
          </p>
        ) : !account ? (
          <p>
            Please login with your metamask account to see NFTs in this
            marketplace
          </p>
        ) : loading ? (
          <div>
            <BeatLoader
              className={styles.chainErrorLoadingCollection}
              color="#36d7b7"
            />
            <p className={styles.chainError}>Loading NFTs... Please wait...</p>
          </div>
        ) : nftList.length === 0 ? (
          <div>
            <p className={styles.chainError}>No NFTs to display...</p>
          </div>
        ) : (
          nftList.map((data, index) => (
            <NFTCard
              nftAddress={data.nftAddress}
              tokenId={data.tokenId.toString()}
              seller={data.seller}
              price={ethers.utils.formatEther(data.price.toString())}
              key={index}
              imageUrl={data.imageUrl}
              tokenName={data.tokenName}
              tokenDescription={data.tokenDescription}
              handleSuccess={handleSuccess}
            />
          ))
        )}
      </div>
    </div>
  );
}
