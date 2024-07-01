import React, { useState } from "react";
import { NavLink } from "./NavLink";
import { useLang } from "../hooks/useLang";
import { WEN } from "../libs/globalContants";
import { useLocation } from "react-router-dom";
import { useLiquity } from "../hooks/LiquityContext";

export const SideBar: React.FC = ({ children }) => {
  const { urlSearch } = useLiquity();
  const { t } = useLang();
  const { pathname } = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(window.innerWidth > 575.98);

  const handleShowMenuForMobile = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <div className="sider">
      <img
        src="images/logo+text.png"
        className="logo" />

      <hr className="division" />

      <NavLink
        label={t("dashboard")}
        icon="images/dashboard.png"
        url={"/" + urlSearch}
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/"}
        target="_self" />

      <NavLink
        label={t("borrow") + " " + WEN.symbol}
        icon="images/borrow.png"
        url={"/borrow" + urlSearch}
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/borrow"}
        target="_self" />

      <NavLink
        label={t("stake") + " " + WEN.symbol}
        icon="images/stake.png"
        url={"/stake" + urlSearch}
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/stake"}
        target="_self" />

      {/* <NavLink
        label={t("governance")}
        icon="images/governance.png"
        url=""
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/governance"} /> */}

      <NavLink
        label={t("liquidations")}
        icon="images/liquidations.png"
        url={"/liquidations" + urlSearch}
        fullWidth={true}
        showExternalLink={false}
        active={pathname === "/liquidations"}
        target="_self" />

      <div
        className="navLink mainMenuForMobile"
        onClick={handleShowMenuForMobile}>
        <img src="images/main-menu.png" />

        {t("menu")}
      </div>

      {showMobileMenu && <div className="mainMenu">
        <NavLink
          label={" " + t("referral")}
          icon="images/referral.png"
          url={"/referral" + urlSearch}
          fullWidth={true}
          showExternalLink={false}
          active={pathname === "/referral"}
          target="_self" />

        <a
          className="navLink"
          href="https://docs.magma.finance/"
          target="_blank">
          <div className="icon">
            <img src="images/docs.png" />
          </div>


          {t("docs")}

          <img
            id="externalLink"
            src="images/external-link.png" />
        </a>

        <a
          className="navLink"
          href="https://twitter.com/MagmaProtocol"
          target="_blank">
          <div className="icon">
            <img src="images/x.png" />
          </div>

          {t("twitter")}

          <img
            id="externalLink"
            src="images/external-link.png" />
        </a>

        <a
          className="navLink"
          href="https://t.me/MagmaProtocol"
          target="_blank">
          <div className="icon">
            <img src="images/tg.png" />
          </div>

          {t("telegram")}

          <img
            id="externalLink"
            src="images/external-link.png" />
        </a>

        <a
          className="navLink"
          href="https://github.com/magma-fi/Audits/blob/main/MagmaStablecoin_final_Secure3_Audit_Report.pdf"
          target="_blank">
          <div className="icon">
            <img src="images/audit.png" />
          </div>

          {t("audit")}

          <img
            id="externalLink"
            src="images/external-link.png" />
        </a>

        <hr className="division" />

        <div style={{
          marginLeft: "16px",
          display: "flex",
          gap: "8px",
          flexDirection: "column"
        }}>
          {/* <StyleModeSelect /> */}

          {/* <LangSelect /> */}
        </div>
      </div>}
    </div>
  );
};