import { ClientDbStoreProvider } from "@/lib/store/indexedDb/provider";
import Header from "./components/Header";
import Board, { ActionsButtons } from "./page.content";
import styles from "./page.module.scss";
import { clsx } from "clsx";


export default function Home() {
  return <>
    <Header />
    <div className="gridBloc">
      <div className="container">
        <ClientDbStoreProvider>
          <Board />
        </ClientDbStoreProvider>
      </div>
    </div>
  </>
}