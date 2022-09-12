import styles from '../styles/Home.module.css';
import { Form, useNotification, Button } from 'web3uikit';
import { useMoralis, useWeb3Contract } from 'react-moralis';
import { ethers } from 'ethers';
import nftAbi from '../constants/BasicNft.json';
import nftMarketplaceAbi from '../constants/NftMarketplace.json';
import networkMapping from '../constants/networkMapping.json';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ClipLoader from 'react-spinners/ClipLoader';

const override = {
  display: 'block',
  margin: '0 auto',
  borderColor: 'red',
};

export default function Home() {
  const router = useRouter();
  const { chainId, account, isWeb3Enabled, Moralis } = useMoralis();
  const chainString = chainId ? parseInt(chainId, 16).toString() : '31337';
  const marketplaceAddress =
    chainString in networkMapping
      ? networkMapping[chainString].NftMarketplace[
          networkMapping[chainString].NftMarketplace.length - 1
        ]
      : '';
  const dispatch = useNotification();
  const [proceeds, setProceeds] = useState('0');
  const [proceedsValue, setProceedsValue] = useState('0');
  const [formNftAddress, setFormNftAddress] = useState('');
  const [formTokenId, setFormTokenId] = useState('');
  const [formPrice, setFormPrice] = useState('0');
  const [loading, setLoading] = useState(false);

  const { runContractFunction } = useWeb3Contract();

  async function approveAndList(e) {
    e.preventDefault();
    setLoading(true);
    console.log('Approving...');
    const nftAddress = formNftAddress;
    const tokenId = formTokenId;
    const price = ethers.utils.parseUnits(formPrice, 'ether').toString();

    const approveOptions = {
      abi: nftAbi,
      contractAddress: nftAddress,
      functionName: 'approve',
      params: {
        to: marketplaceAddress,
        tokenId: tokenId,
      },
    };

    await runContractFunction({
      params: approveOptions,
      onSuccess: () => handleApproveSuccess(nftAddress, tokenId, price),
      onError: (error) => {
        console.log(error);
        setLoading(false);
      },
    });
  }

  async function handleApproveSuccess(nftAddress, tokenId, price) {
    console.log('Ok! Now time to list');
    console.log('Nice!');
    const listOptions = {
      abi: nftMarketplaceAbi,
      contractAddress: marketplaceAddress,
      functionName: 'listItem',
      params: {
        nftAddress: nftAddress,
        tokenId: tokenId,
        price: price,
      },
    };

    await runContractFunction({
      params: listOptions,
      onSuccess: handleListSuccess,
      onError: (error) => {
        setLoading(false);
        console.log(error);
      },
    });
  }

  async function handleListSuccess(tx) {
    await tx.wait(1);
    dispatch({
      type: 'success',
      message: 'NFT listing',
      title: 'NFT listed',
      position: 'topR',
    });
    setLoading(false);
    router.push('/');
  }

  const handleWithdrawSuccess = async (tx) => {
    const txReceipt = await tx.wait(1);
    console.log(txReceipt);
    dispatch({
      type: 'success',
      message: 'Withdrawing proceeds',
      position: 'topR',
    });
    setLoading(false);
    setProceedsValue('WALAO');
  };

  async function setupUI() {
    const returnedProceeds = await runContractFunction({
      params: {
        abi: nftMarketplaceAbi,
        contractAddress: marketplaceAddress,
        functionName: 'getProceeds',
        params: {
          seller: account,
        },
      },
      onError: (error) => {
        console.log(error);
        setLoading(false);
      },
    });
    if (returnedProceeds) {
      setProceeds(returnedProceeds.toString());
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      if (marketplaceAddress !== '') {
        setupUI();
      }
    }
  }, [proceeds, account, isWeb3Enabled, chainId, proceedsValue]);

  return (
    <div className={[styles.container, styles.sellNftContainer].join(' ')}>
      {!account ? (
        <p className={styles.chainError}>No account connected</p>
      ) : chainString in networkMapping ? (
        <form className={styles.sellNftForm} onSubmit={approveAndList}>
          <label className={styles.sellNftCaption}>Sell your NFT!</label>
          <div className={styles.nftFormContainer}>
            <input
              type="text"
              placeholder="NFT Address"
              id="nftAddress"
              name="nftAddress"
              required
              onChange={(event) => {
                setFormNftAddress(event.target.value);
              }}
            />
          </div>
          <div className={styles.nftFormContainer}>
            <input
              type="text"
              placeholder="Token ID"
              id="tokenId"
              name="tokenId"
              required
              onChange={(event) => {
                setFormTokenId(event.target.value);
              }}
            />
          </div>
          <div className={styles.nftFormContainer}>
            <input
              type="number"
              placeholder="Price"
              id="price"
              name="price"
              step="0.1"
              required
              onChange={(event) => {
                setFormPrice(event.target.value);
              }}
            />
          </div>
          <button className={styles.sellNftBtn} disabled={loading}>
            {loading ? (
              <ClipLoader cssOverride={override} size={25} />
            ) : (
              'Sell NFT'
            )}
          </button>
        </form>
      ) : (
        <p className={styles.chainError}>
          The connected chain is not available on this marketplace. Please
          switch to Rinkeby Testnet.
        </p>
      )}
      {!account ? (
        <div></div>
      ) : chainString in networkMapping ? (
        <div className={styles.proceedsContainer}>
          <div>Withdraw {ethers.utils.formatUnits(proceeds, 'ether')} ETH</div>
          {proceeds != '0' ? (
            <button
              className={styles.sellNftBtn}
              onClick={async () => {
                const result = await runContractFunction({
                  params: {
                    abi: nftMarketplaceAbi,
                    contractAddress: marketplaceAddress,
                    functionName: 'withdrawProceeds',
                    params: {},
                  },
                  onError: (error) => console.log(error),
                  onSuccess: handleWithdrawSuccess,
                });
              }}
            >
              Withdraw
            </button>
          ) : (
            <div>No proceeds detected</div>
          )}
        </div>
      ) : (
        <div></div>
      )}
    </div>
  );
}
