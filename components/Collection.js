import styles from '../styles/Home.module.css';
import NFTCard from './NFTCard';
import nftAbi from '../constants/BasicNft.json';
import nftMarketplaceAbi from '../constants/NftMarketplace.json';
import networkMapping from '../constants/networkMapping.json';
import { useMoralis, useWeb3Contract } from 'react-moralis';
import { useEffect, useState } from 'react';

export default function Collection() {
  const { chainId, account, isWeb3Enabled, Moralis, network } = useMoralis();

  const [nftList, setNftList] = useState([]);
  const [updateCancel, setUpdateCancel] = useState('update');
  let chainString = chainId ? parseInt(chainId, 16).toString() : '31337';
  const marketplaceAddress =
    chainString in networkMapping
      ? networkMapping[chainString].NftMarketplace[
          networkMapping[chainString].NftMarketplace.length - 1
        ]
      : '';

  const { runContractFunction } = useWeb3Contract();

  async function getListData() {
    const listOptions = {
      abi: nftMarketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: 'getCompleteListing',
      params: {},
    };

    const listData = await runContractFunction({
      params: listOptions,
      onSuccess: () => console.log('Success!'),
      onError: (error) => console.log(error, ' !!!!<<<'),
    });
    if (listData) {
      setNftList(
        listData.filter((data) => {
          return data.price.toString() !== '0';
        })
      );
    }
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      if (parseInt(chainId, 16).toString() in networkMapping) {
        if (marketplaceAddress !== '') {
          getListData();
        }
      } else {
        setNftList([]);
      }
    }
  }, [isWeb3Enabled, updateCancel, chainId]);

  useEffect(() => {
    Moralis.onChainChanged((chain) => {
      const hexadecimal = parseInt(chainId, 16);
      chainString = hexadecimal.toString();
      if (chainString in networkMapping) {
        if (marketplaceAddress !== '') {
          getListData();
        }
      } else {
        setNftList([]);
      }
    });
  }, []);

  return (
    <div className={styles.collection}>
      <p className={styles.collectionTitle}>Collection</p>
      <p className={styles.collectionDescription}>
        Lorem ipsum dolor sit amet, consectetur
      </p>
      <div
        className={
          !chainString in networkMapping || !account
            ? ''
            : nftList.length
            ? styles.nftContainer
            : ''
        }
      >
        {!account ? (
          <div>
            <p className={styles.chainError}>
              Please login with Metamask account
            </p>
          </div>
        ) : chainString in networkMapping ? (
          nftList.length === 0 ? (
            <div>
              <p className={styles.chainError}>No NFTs to display...</p>
            </div>
          ) : (
            nftList.map((data, index) => (
              <NFTCard
                nftAddress={data.nftAddress}
                tokenId={data.tokenId.toString()}
                seller={data.seller}
                price={data.price}
                key={index}
                setUpdateCancel={setUpdateCancel}
                updateCancel={updateCancel}
              />
            ))
          )
        ) : (
          <div>
            <p className="text-center">
              The connected chain is not available on this marketplace. Please
              switch to Rinkeby Testnet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
