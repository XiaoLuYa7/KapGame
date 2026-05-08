const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataManagerSource = fs.readFileSync(path.join(root, 'assets/scripts/core/DataManager.ts'), 'utf8');
const progressBarSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/ProgressBarCtrl.ts'), 'utf8');
const homeViewSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/HomeView.ts'), 'utf8');
const gameViewSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/GameView.ts'), 'utf8');
const rankingPopupSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/LastWeekRankingPopupLayer.ts'), 'utf8');
const homeSceneSource = fs.readFileSync(path.join(root, 'assets/Home.scene'), 'utf8');

assert(
    dataManagerSource.includes('ensureDevelopmentLogin'),
    'DataManager should expose ensureDevelopmentLogin for local development login state'
);

assert(
    progressBarSource.includes('dataManager.ensureDevelopmentLogin()'),
    'ProgressBarCtrl should create the development login before entering Home'
);

assert(
    dataManagerSource.includes('rankIcon') && dataManagerSource.includes('diamond') && dataManagerSource.includes('gold'),
    'development user should include rank icon and currency fields'
);

assert(
    homeViewSource.includes('RankButton/RankIcon') && homeViewSource.includes('userData.rankIcon'),
    'HomeView should render the development user rank icon on RankButton'
);

assert(
    homeViewSource.includes('HeaderContainer/UserResPanel/RankButton/RankIcon')
        && homeViewSource.includes('HeaderContainer/UserResPanel/RankButton/RankLabel')
        && homeViewSource.includes('HeaderContainer/UserResPanel/ResourcesPanel/DiamondPanel/DiamondLabel')
        && homeViewSource.includes('HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/GoldLabel'),
    'HomeView should bind the Home header rank and currency labels from UserResPanel'
);

assert(
    homeViewSource.indexOf('HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/GoldLabel')
        < homeViewSource.indexOf('HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/DiamondLabel'),
    'HomeView should prefer GoldLabel over the legacy GoldPanel/DiamondLabel fallback'
);

assert(
    rankingPopupSource.includes('UserNode/GoldAndRewardNode/GoldNode/CountLabel')
        && rankingPopupSource.includes('UserNode/GoldAndRewardNode/RewardNode/CountLabel'),
    'ranking popup should bind GoldAndRewardNode gold and reward labels'
);

assert(
    rankingPopupSource.includes("'RankNode/RankSprite'")
        && rankingPopupSource.includes("'RankNode/RankLabel'")
        && rankingPopupSource.includes("'GoldAndRewardNode/GoldNode/CountLabel'")
        && rankingPopupSource.includes("'GoldAndRewardNode/RewardNode/CountLabel'"),
    'ranking popup should support the flattened UserItem structure without UserNode'
);

assert(
    rankingPopupSource.includes('getRankReward') && rankingPopupSource.includes('50') && rankingPopupSource.includes('30') && rankingPopupSource.includes('10'),
    'ranking popup should calculate top 3 rewards as 50, 30, and 10'
);

assert(
    rankingPopupSource.includes('isDevelopmentEnvironment()') && rankingPopupSource.includes('cachedRankingData'),
    'ranking popup should skip slow local mock HTTP and cache loaded ranking data'
);

assert(
    rankingPopupSource.includes('excisionNodeTemplate')
        && rankingPopupSource.includes('PopupPanel/ContentNode/ScrollView/view/content/ExcisionNode'),
    'ranking popup should bind the ExcisionNode template from the ranking content'
);

assert(
    rankingPopupSource.includes('0.2') && rankingPopupSource.includes('0.6'),
    'ranking popup should insert ExcisionNode prompts at promotion 20% and retention 60% cutoffs'
);

assert(
    rankingPopupSource.includes('BeforeLabel')
        && rankingPopupSource.includes('NeedCountLabel')
        && rankingPopupSource.includes('CoinSprite')
        && rankingPopupSource.includes('AfterLabel')
        && rankingPopupSource.includes('超过Ta，本周将升段')
        && rankingPopupSource.includes('超过Ta，本周将保留段位'),
    'ranking popup should fill ExcisionNode labels and show the coin sprite'
);

assert(
    rankingPopupSource.includes('currentUserItem')
        && rankingPopupSource.includes('PopupPanel/ContentNode/CurrentUserItem'),
    'ranking popup should bind CurrentUserItem under PopupPanel/ContentNode'
);

assert(
    rankingPopupSource.includes('refreshCurrentUserItem')
        && rankingPopupSource.includes('getCurrentRankingUserItem')
        && rankingPopupSource.includes('dataManager.userData.nickName'),
    'ranking popup should refresh the fixed current user ranking item from the logged-in user'
);

assert(
    rankingPopupSource.includes('refreshCurrentUserRankStatus')
        && rankingPopupSource.includes("'GoldAndRewardNode/RewardNode/Label'")
        && rankingPopupSource.includes('下周将升级段位')
        && rankingPopupSource.includes('下周将保留段位')
        && rankingPopupSource.includes('下周将降低段位'),
    'ranking popup should show the fixed current user next-week rank status'
);

assert(
    gameViewSource.includes('button.clickEvents.length > 0'),
    'GameView should not add a duplicate RankButton click handler when the scene already wires one'
);

assert(
    homeViewSource.includes('hideStartupPopups()'),
    'HomeView should reset popup visibility every time the Home scene starts'
);

for (const popupName of [
    'SettingsPopupLayer',
    'PrivacyPolicyLayer',
    'UserAgreementLayer',
    'BindPhoneLayer',
    'RealNameLayer',
    'LevelRewardPopupLayer',
    'BountyTaskPopupLayer',
    'ChangeTaskPopupLayer',
    'DailyCheckInPopupLayer',
    'LastWeekRankingPopupLayer'
]) {
    assert(
        homeViewSource.includes(`'${popupName}'`),
        `HomeView startup popup reset should include ${popupName}`
    );
}

assert(
    homeSceneSource.includes('"_name": "LastWeekRankingPopupLayer"'),
    'Home.scene should include LastWeekRankingPopupLayer node'
);
