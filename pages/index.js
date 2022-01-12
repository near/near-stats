import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Background from '../components/Background';
import Datatable from '../components/datatable';
import AreaChart from '../components/areaChart';
import BarChart from '../components/barChart';
import GraphCard from '../components/Graphcard';
import BrushChart from '../components/brushChart';
import BrushedAreaChart from '../components/brushedAreaChart';
import Tooltip from '../components/tooltip';
import { keepTheme } from '../helpers/theme';

import styles from '../styles/Home.module.scss'


const Home = ({ total_accounts, app_summary, app_total, apps}) => {

  // set hooks for dropdowns and switches
  const [date_compare, setDateCompare] = React.useState(30);
  const [network, setNetwork] = React.useState('mainnet');
  const [tooltip, setTooltip] = React.useState({ visible: false, data: {}, x: 0, y: 0 });
  const [goals, setGoals] = React.useState([]);
  const [milestones, setMilestones] = React.useState([]);
  const [label, setLabel] = React.useState('Percent')
  const [detail, setDetail] = React.useState(false);
  const [detailGrowth, setDetailGrowth] = React.useState(false);
  const [checked, setChecked] = React.useState(false);

  // set functionality for maintaining dark mode setting on reload
  React.useEffect(() => {
    keepTheme(setChecked);
},[]);

  return (
    <>
      <Background />
        <div className={styles.background}>
          <Tooltip visible={tooltip.visible} data={tooltip.data} x={tooltip.x} y={tooltip.y}></Tooltip>
          <div>
            <Header setDateCompare={setDateCompare} setNetwork={setNetwork} setChecked={setChecked} checked={checked}></Header>
            <div className={styles.gridContainer}>
              <div className="global-flex-container">
                <GraphCard title="Total NEAR Accounts" size="half" icon='/images/Frametotalacc.png' setSelect={setGoals} placeholder='Goals' dateCompare={date_compare}>
                  <BrushChart data={total_accounts} x='collected_for_day' y='total_accounts'>
                    {options => <BrushedAreaChart data={options.data} prediction_data={options.prediction_data} x='collected_for_day' y='total_accounts' compare={date_compare} selection={options.selection} goals={goals} setTooltip={setTooltip} />}
                  </BrushChart>
                </GraphCard>
                <GraphCard title="Top NEAR Apps" size="half" icon='/images/Frametopapps.png' setSelect={setMilestones} placeholder='Milestones' label_type={label} setLabel={setLabel} dateCompare={date_compare}>
                  <BarChart data={app_summary} app_data={apps} x='total_accounts' y='entity_id' compare={`accounts_${date_compare}_days_ago`} goals={milestones} setTooltip={setTooltip} label_type={label} />
                </GraphCard>
                <GraphCard title="Total NEAR Accounts by App" size="half" icon='/images/Frametotalaccbyapp.png' setSelect={setDetail} dateCompare={date_compare}>
                  <AreaChart account_data={total_accounts} app_data={app_total} x='collected_for_day' y='total_accounts' compare={date_compare} detail={detail} setTooltip={setTooltip} />
                </GraphCard>
                <GraphCard title="NEAR Account Growth By App" size="half" icon='/images/Framenewaccbyapp.png' setSelect={setDetailGrowth} dateCompare={date_compare}>
                  <AreaChart account_data={total_accounts} app_data={app_total} growth={true} x='collected_for_day' y='total_accounts' compare={date_compare} detail={detailGrowth} setTooltip={setTooltip} />
                </GraphCard>
                <GraphCard title="Near App Momentum" icon='/images/Frameappmomentum.png'>
                  <Datatable data={app_summary} app_data={apps} accounts='total_accounts' name='entity_id' thirty="accounts_30_days_ago" ninety="accounts_90_days_ago" />
                </GraphCard>
              </div>
            </div>
            <Footer></Footer>
          </div>
        </div>
    </>
  )
}

// pull data from API
export async function getServerSideProps() {

  let total_accounts = await fetch(`http://localhost:${process.env.NEXT_PORT || process.env.PORT || 3000}/api/v1/mainnet/accounts/total`)
  total_accounts = await total_accounts.json()
  let app_summary = await fetch(`http://localhost:${process.env.NEXT_PORT || process.env.PORT || 3000}/api/v1/mainnet/apps/accounts/summary`)

  app_summary = await app_summary.json()
  let app_total = await fetch(`http://localhost:${process.env.NEXT_PORT || process.env.PORT || 3000}/api/v1/mainnet/apps/accounts/total?limit=10`)
  app_total = await app_total.json()
  let apps = await fetch(`http://localhost:${process.env.NEXT_PORT || process.env.PORT || 3000}/api/v1/mainnet/apps?contract=true`)
  apps = await apps.json()
  if (!total_accounts || !app_summary || !app_total || !apps) {
    return {
      notFound: true,
    }
  }
  return {
    props: { total_accounts, app_summary, app_total, apps }, // will be passed to the page component as props
  }
}

export default Home

