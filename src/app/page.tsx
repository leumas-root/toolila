import Header from "./components/Header";
import Board, { ActionsButtons } from "./page.content";
import styles from "./page.module.scss";
import { clsx } from "clsx";


export default function Home() {
  return <>
    <Header />
    <div className="gridBloc">
      <div className="container">
        <Board />
      </div>
    </div>
    <ActionsButtons />
  </>
}