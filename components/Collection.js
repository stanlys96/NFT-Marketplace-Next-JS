import styles from '../styles/Home.module.css';
import NFTCard from './NFTCard';

export default function Collection() {
  return (
    <div className={styles.collection}>
      <p className={styles.collectionTitle}>Collection</p>
      <p className={styles.collectionDescription}>
        Lorem ipsum dolor sit amet, consectetur
      </p>
      <div className={styles.nftContainer}>
        <NFTCard />
        <NFTCard />
        <NFTCard />
        <NFTCard />
      </div>
    </div>
  );
}
