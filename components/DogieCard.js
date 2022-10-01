import styles from '../styles/Home.module.css';
import Image from 'next/image';
import Swal from 'sweetalert2';
import { useMoralis } from 'react-moralis';
import networkMapping from '../constants/networkMapping.json';

export function DogieCard({ imgUrl, name }) {
  const { chainId, account } = useMoralis();
  let chainString = chainId ? parseInt(chainId, 16).toString() : '31337';
  const basicNftAddress =
    chainString in networkMapping
      ? networkMapping[chainString].BasicNft[
          networkMapping[chainString].BasicNft.length - 1
        ]
      : '';
  return (
    <div
      onClick={() => {
        Swal.fire({
          title: 'Goerli Network',
          html: `<div>
            <div class=${styles.swalParagraph}>NFT Address: ${basicNftAddress}</div>
            <div class=${styles.swalParagraph}>An adorable ${name} pup!</div>
          <div>`,
          imageUrl: imgUrl,
          imageWidth: 150,
          imageHeight: 150,
          imageAlt: 'Custom image',
          scrollbarPadding: 0,
        });
      }}
      className={styles.dogieCollectionCard}
    >
      <Image
        // loader={() => imageUrl}
        className={styles.nftCardImg}
        src={imgUrl}
        width={150}
        height={150}
      />
      <p className={styles.dogieCollectionDesc}>{name}</p>
    </div>
  );
}
