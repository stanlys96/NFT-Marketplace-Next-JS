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
import axios from 'axios';
import { ClockLoader } from 'react-spinners';
import Swal from 'sweetalert2';

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
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [imageURI, setImageURI] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenDescription, setTokenDescription] = useState('');

  const { runContractFunction } = useWeb3Contract();

  async function approveAndList(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const ownerOfTokenId = await runContractFunction({
        params: {
          abi: nftAbi,
          contractAddress: formNftAddress,
          functionName: 'ownerOf',
          params: {
            tokenId: formTokenId,
          },
        },
        onError: (error) => {
          console.log(error, ' <<< WALAO');
          setLoading(false);
        },
      });
      let tokenIdOwner = !ownerOfTokenId ? '' : ownerOfTokenId;
      if (tokenIdOwner.toLowerCase() !== account.toLowerCase()) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'You are not the owner of the NFT!',
        });
        setLoading(false);
      } else {
        const url =
          'https://server-nft-marketplace.herokuapp.com/checkNftAddressTokenId';
        let responseResult = [];
        const response = await axios.post(url, {
          nftAddress: formNftAddress,
          tokenId: formTokenId,
        });
        if (response.status === 200) {
          responseResult = response.data;
          if (responseResult.length > 0) {
            Swal.fire({
              icon: 'error',
              title: 'Oops...',
              text: 'NFT Already Listed!',
            });
            setLoading(false);
          } else {
            console.log('Approving...');
            const nftAddress = formNftAddress;
            const tokenId = formTokenId;
            const price = ethers.utils
              .parseUnits(formPrice, 'ether')
              .toString();

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
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'API Status Error!',
          });
          setLoading(false);
        }
      }
    } catch (e) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: e.message,
      });
      setLoading(false);
    }
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
    const tokenURI = await runContractFunction({
      params: {
        abi: nftAbi,
        contractAddress: formNftAddress,
        functionName: 'tokenURI',
        params: {
          tokenId: formTokenId,
        },
        onSuccess: () => console.log('success!'),
        onError: (error) => {
          console.log(error);
        },
      },
    });
    console.log(tokenURI, ' HEY <<<');
    const url = 'https://server-nft-marketplace.herokuapp.com/insertItemListed';
    let imageURIURLTemp = '';
    let tokenNameTemp = '';
    let tokenDescriptionTemp = '';
    if (tokenURI) {
      // IPFS Gateway: A server that will return IPFS files from a "normal" URL.
      const requestURL = tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      const tokenURIResponse = await (await fetch(requestURL)).json();
      const imageURI = tokenURIResponse.image;
      const imageURIURL = imageURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
      imageURIURLTemp = imageURIURL;
      tokenNameTemp = tokenURIResponse.name;
      tokenDescriptionTemp = tokenURIResponse.description;
      setImageURI(imageURIURL);
      setTokenName(tokenURIResponse.name);
      setTokenDescription(tokenURIResponse.description);
      // We could render the Image on our sever, and just call our sever.
      // For testnets & mainnet -> use moralis server hooks
      // Have the world adopt IPFS
      // Build our own IPFS gateway
    }
    console.log(imageURIURLTemp, ' <??ASDASDASD');
    await tx.wait(1);
    try {
      // setLoading(true);
      const response = await axios.post(url, {
        nftAddress: formNftAddress,
        tokenId: formTokenId,
        price: formPrice,
        seller: account,
        imageUrl: imageURIURLTemp,
        tokenName: tokenNameTemp,
        tokenDescription: tokenDescriptionTemp,
      });
      if (response.status === 200) {
        // setLoading(false);
        console.log(response, ' <<<<');
      } else {
        // setLoading(false);
      }
    } catch (e) {
      // setLoading(false);
      console.log(e);
    }
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
    setWithdrawLoading(false);
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
  }, [proceeds, account, isWeb3Enabled, chainId, proceedsValue, chainId]);

  return (
    <div className={[styles.container, styles.sellNftContainer].join(' ')}>
      {
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
              step="0.01"
              required
              onChange={(event) => {
                setFormPrice(event.target.value);
              }}
            />
          </div>
          {!account ? (
            <span className={styles.chainError}>No Account Connected</span>
          ) : chainString in networkMapping == false ? (
            <span className={styles.chainError}>
              The connected chain is not available on this marketplace.
              <br />
              Please switch to Goerli Testnet.
            </span>
          ) : (
            <button className={styles.sellNftBtn} disabled={loading}>
              {loading ? (
                <ClockLoader
                  className={styles.chainErrorLoading}
                  size={30}
                  color="#36d7b7"
                />
              ) : (
                <span>Sell NFT</span>
              )}
            </button>
          )}
        </form>
      }
      {!account ? (
        <div></div>
      ) : chainString in networkMapping ? (
        <div className={styles.proceedsContainer}>
          <div>Withdraw {ethers.utils.formatUnits(proceeds, 'ether')} ETH</div>
          {proceeds != '0' ? (
            <button
              className={styles.sellNftBtn}
              disabled={withdrawLoading}
              onClick={async () => {
                setWithdrawLoading(true);
                const result = await runContractFunction({
                  params: {
                    abi: nftMarketplaceAbi,
                    contractAddress: marketplaceAddress,
                    functionName: 'withdrawProceeds',
                    params: {},
                  },
                  onError: (error) => {
                    console.log(error);
                    setWithdrawLoading(false);
                  },
                  onSuccess: handleWithdrawSuccess,
                });
              }}
            >
              {withdrawLoading ? (
                <ClockLoader
                  className={styles.chainErrorLoading}
                  size={30}
                  color="#36d7b7"
                />
              ) : (
                'Withdraw'
              )}
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
