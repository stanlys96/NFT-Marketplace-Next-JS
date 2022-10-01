import styles from '../styles/Home.module.css';
import NFTCard from './NFTCard';
import axios from 'axios';
import nftAbi from '../constants/BasicNft.json';
import nftMarketplaceAbi from '../constants/NftMarketplace.json';
import networkMapping from '../constants/networkMapping.json';
import { useMoralis, useWeb3Contract } from 'react-moralis';
import { useEffect, useState } from 'react';
import { BeatLoader } from 'react-spinners';

export default function Collection() {
  const { chainId, account, isWeb3Enabled, Moralis, network } = useMoralis();

  const [nftList, setNftList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updateCancel, setUpdateCancel] = useState('update');
  let chainString = chainId ? parseInt(chainId, 16).toString() : '31337';
  const marketplaceAddress =
    chainString in networkMapping
      ? networkMapping[chainString].NftMarketplace[
          networkMapping[chainString].NftMarketplace.length - 1
        ]
      : '';

  const { runContractFunction } = useWeb3Contract();

  const handleSuccess = () => {
    setUpdateCancel((state) => {
      console.log('heyy');
      console.log(state, ' <<<< STATE!');
      const newData = state + '1';
      return newData;
    });
  };

  async function getListData() {
    console.log('????');
    const url = 'https://server-nft-marketplace.herokuapp.com/getActiveItems';
    setLoading(true);
    try {
      const response = await axios({ url, method: 'GET' });
      if (response.status === 200) {
        setLoading(false);
        console.log(response, ' <<<<');
        setNftList(response.data);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
      console.log(e);
    }
    // const listOptions = {
    //   abi: nftMarketplaceAbi,
    //   contractAddress: marketplaceAddress,
    //   functionName: 'getCompleteListing',
    //   params: {},
    // };

    // const listData = await runContractFunction({
    //   params: listOptions,
    //   onSuccess: () => console.log('Success!'),
    //   onError: (error) => console.log(error, ' !!!!<<<'),
    // });
    // if (listData) {
    //   setNftList(
    //     listData.filter((data) => {
    //       return data.price.toString() !== '0';
    //     })
    //   );
    // }
  }
  useEffect(() => {
    getListData();
    // if (isWeb3Enabled) {
    //   if (parseInt(chainId, 16).toString() in networkMapping) {
    //     if (marketplaceAddress !== '') {
    //     }
    //   } else {
    //     setNftList([]);
    //   }
    // }
  }, [updateCancel]);

  useEffect(() => {
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
  }, []);

  return (
    <div className={styles.collection}>
      <p className={styles.collectionTitle}>NFT Collections!</p>
      <p className={styles.collectionDescription}>
        A platform for buying and selling NFTs!
      </p>
      <div
        className={
          !chainString in networkMapping || loading
            ? ''
            : nftList.length
            ? styles.nftContainer
            : ''
        }
      >
        {loading ? (
          <div>
            <BeatLoader className={styles.chainErrorLoadingCollection} color="#36d7b7" />
            <p className={styles.chainError}>Loading NFTs... Please wait...</p>
          </div>
        ) : nftList.length === 0 ? (
          <div>
            <p className={styles.chainError}>No NFTs to display...</p>
          </div>
        ) : (
          nftList.map((data, index) => (
            <NFTCard
              nftAddress={data.nft_address}
              tokenId={data.token_id.toString()}
              seller={data.seller}
              price={data.price}
              key={index}
              imageUrl={data.image_url}
              tokenName={data.token_name}
              tokenDescription={data.token_description}
              handleSuccess={handleSuccess}
            />
          ))
        )}
      </div>
    </div>
  );
}
