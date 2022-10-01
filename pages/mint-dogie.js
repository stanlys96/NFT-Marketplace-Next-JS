import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/Home.module.css';
import { DogieCard } from '../components/DogieCard';
import networkMapping from '../constants/networkMapping.json';
import { BeatLoader } from 'react-spinners';
import { useMoralis, useWeb3Contract } from 'react-moralis';
import nftAbi from '../constants/BasicNft.json';
import { useNotification } from 'web3uikit';
import Swal from 'sweetalert2';

export default function Home() {
  const { chainId, account } = useMoralis();
  const [mintLoading, setMintLoading] = useState(false);
  let chainString = chainId ? parseInt(chainId, 16).toString() : '31337';
  const { runContractFunction } = useWeb3Contract();
  const basicNftAddress =
    chainString in networkMapping
      ? networkMapping[chainString].BasicNft[
          networkMapping[chainString].BasicNft.length - 1
        ]
      : '';
  const dogieCollection = [
    { imgSrc: '/img/pug.png', name: 'Pug' },
    { imgSrc: '/img/shiba-inu.png', name: 'Shiba-inu' },
    { imgSrc: '/img/st-bernard.png', name: 'St. Bernard' },
  ];

  async function handleMintSuccess(tx) {
    const receipt = await tx.wait(1);
    Swal.fire({
      icon: 'success',
      title: 'NFT Minted!',
      html: `<div class=${
        styles.swalParagraph
      }>You just minted Dogie NFT with token ID: ${receipt.events[0].args.tokenId.toString()}!<br/></div><div class=${
        styles.swalParagraph
      }>You can view your NFT here: https://testnets.opensea.io/assets/goerli/${basicNftAddress}/${receipt.events[0].args.tokenId.toString()}<br/></div>
             <div class=${
               styles.swalParagraph
             }>Your transaction hash: https://goerli.etherscan.io/tx/${
        receipt.transactionHash
      }</div>`,
    });
    setMintLoading(false);
  }

  async function mintDogie() {
    setMintLoading(true);
    const listOptions = {
      abi: nftAbi,
      contractAddress: basicNftAddress,
      functionName: 'mintNft',
    };

    await runContractFunction({
      params: listOptions,
      onSuccess: handleMintSuccess,
      onError: (error) => {
        console.log(error);
        setMintLoading(false);
      },
    });
  }

  return (
    <div className={[styles.container, styles.mintDogieContainer].join(' ')}>
      <p className={styles.mintDogieTitle}>
        Get one of these three cute dogies!
      </p>
      <div className={styles.dogieCollectionContainer}>
        {dogieCollection.map((dogie, index) => (
          <DogieCard imgUrl={dogie.imgSrc} name={dogie.name} key={index} />
        ))}
      </div>
      {chainString in networkMapping === false ? (
        <p className={styles.chainErrorText}>
          Please connect to Goerli Testnet
        </p>
      ) : !account ? (
        <p className={styles.chainErrorText}>
          Please login with your metamask account
        </p>
      ) : (
        <button
          onClick={() => {
            mintDogie();
          }}
          className={styles.mintDogieBtn}
          disabled={mintLoading}
        >
          {mintLoading ? (
            <BeatLoader size={8} color="#36d7b7" />
          ) : (
            <span className={styles.nftCardBuy}>Mint a Dogie!</span>
          )}
        </button>
      )}
    </div>
  );
}
