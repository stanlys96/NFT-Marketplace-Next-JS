import styles from '../styles/Home.module.css';
import NFTCard from './NFTCard';
import nftAbi from '../constants/BasicNft.json';
import nftMarketplaceAbi from '../constants/NftMarketplace.json';
import networkMapping from '../constants/networkMapping.json';
import { useMoralis, useWeb3Contract } from 'react-moralis';
import { useEffect, useState } from 'react';

export default function Collection() {
  const { chainId, account, isWeb3Enabled, Moralis, network } = useMoralis();
  const chainString = chainId ? parseInt(chainId).toString() : '31337';
  const marketplaceAddress =
    chainString in networkMapping
      ? networkMapping[chainString].NftMarketplace[
          networkMapping[chainString].NftMarketplace.length - 1
        ]
      : '';

  const [nftList, setNftList] = useState([]);
  const [updateCancel, setUpdateCancel] = useState('update');

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
      onError: (error) => console.log(error),
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
    console.log('!!!');
    if (isWeb3Enabled) {
      console.log('???');
      if (marketplaceAddress != '') {
        getListData();
      }
    }
  }, [isWeb3Enabled, updateCancel]);

  useEffect(() => {
    Moralis.onChainChanged((chain) => {
      console.log(chain, ' <<<');
      if (marketplaceAddress != '') {
        getListData();
      }
    });
  }, []);

  return (
    <div className={styles.collection}>
      <p className={styles.collectionTitle}>Collection</p>
      <p className={styles.collectionDescription}>
        Lorem ipsum dolor sit amet, consectetur
      </p>
      <div className={nftList.length ? styles.nftContainer : ''}>
        {chainString in networkMapping ? (
          nftList.length === 0 ? (
            <div>
              <p className="text-center">No NFTs to display...</p>
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
