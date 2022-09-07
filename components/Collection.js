import styles from '../styles/Home.module.css';
import { Card, useNotification } from 'web3uikit';

export default function Collection() {
  return (
    <div className={styles.collection}>
      <p>Collection</p>
      <p>Lorem ipsum dolor sit amet, consectetur</p>
      <div className={styles.nftContainer}>
        {/* <Card title="Hello" description="Hello World" /> */}
      </div>
    </div>
  );
}
