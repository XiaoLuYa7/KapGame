const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dataManagerSource = fs.readFileSync(path.join(root, 'assets/scripts/core/DataManager.ts'), 'utf8');
const progressBarSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/ProgressBarCtrl.ts'), 'utf8');
const homeViewSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/HomeView.ts'), 'utf8');
const homeUiSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/HomeUI.ts'), 'utf8');
const gameViewSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/GameView.ts'), 'utf8');
const chatUiSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/ChatUI.ts'), 'utf8');
const activityPopupSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/ActivityPopupRoot.ts'), 'utf8');
const tabBarSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/TabBar.ts'), 'utf8');
const rankingPopupSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/WeekRankingPopupLayer.ts'), 'utf8');
const lastWeekRankingPopupSource = fs.readFileSync(path.join(root, 'assets/scripts/ui/LastWeekRankingPopupLayer.ts'), 'utf8');
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
    dataManagerSource.includes('createDevelopmentUserInfo')
        && dataManagerSource.includes('subscribeUserData')
        && dataManagerSource.includes('notifyUserDataChanged')
        && dataManagerSource.includes('createDevelopmentDailyCheckInData')
        && dataManagerSource.includes('getNextDevelopmentDailyCheckInClaimableDayIndex')
        && dataManagerSource.includes('getDevelopmentDailyCheckInClaimReward')
        && dataManagerSource.includes('createDevelopmentLevelRewardData')
        && dataManagerSource.includes('claimDevelopmentDailyCheckIn')
        && dataManagerSource.includes('claimDevelopmentLevelReward')
        && dataManagerSource.includes('multiplier: number = 1')
        && dataManagerSource.includes('diamondCost: number = 0')
        && dataManagerSource.includes('Math.random'),
    'DataManager should generate random development user, check-in, level reward state, and notify reactive user data changes'
);

assert(
    dataManagerSource.includes('getDevelopmentLevelRewardParts')
        && dataManagerSource.includes('Array.from({ length: 60 }')
        && dataManagerSource.includes("rewardType: 'GOLD'")
        && dataManagerSource.includes("rewardType: 'DIAMOND'")
        && dataManagerSource.includes('this.interpolateRewardCount(level, 1, 30, 100, 500)')
        && dataManagerSource.includes('this.interpolateRewardCount(level, 31, 60, 10, 100)')
        && dataManagerSource.includes('finishClaim: boolean = true'),
    'development level rewards should cover levels 1-60, with gold scaling 100-500 and diamond added from level 31-60'
);

assert(
    dataManagerSource.includes('this.updateUserData({ diamond: nextDiamond, gold: nextGold })')
        && dataManagerSource.includes('return null')
        && dataManagerSource.indexOf('if (cost > 0 && this.userData.diamond < cost)')
            < dataManagerSource.indexOf('this.updateUserData({ diamond: nextDiamond, gold: nextGold })'),
    'development reward claims should fail when diamonds are insufficient and update user data through the reactive path'
);

assert(
    dataManagerSource.includes('const claimedDayCount = this.randomInt(0, todayIndex - 1)')
        && dataManagerSource.includes('claimableDayIndex = this.getNextDevelopmentDailyCheckInClaimableDayIndex(claimedDays, todayIndex)')
        && dataManagerSource.includes('claimedDays.indexOf(dayIndex) >= 0')
        && dataManagerSource.indexOf('getDevelopmentDailyCheckInClaimReward(data)')
            < dataManagerSource.indexOf('reward.claimed = true'),
    'development daily check-in should claim the nearest unclaimed day instead of skipping to a later claimable day'
);

assert(
    activityPopupSource.includes('getDevelopmentDailyCheckInData')
        && activityPopupSource.includes('claimDevelopmentDailyCheckIn')
        && activityPopupSource.includes('getDevelopmentLevelRewardData')
        && activityPopupSource.includes('claimDevelopmentLevelReward')
        && activityPopupSource.includes('showRewardPopupForLevelReward')
        && activityPopupSource.includes('showRewardPopupForDailyCheckIn')
        && activityPopupSource.includes('showRewardPopupForBountyTask')
        && activityPopupSource.includes("source: 'level'")
        && activityPopupSource.includes("source: 'dailyCheckIn'")
        && activityPopupSource.includes("source: 'bountyTask'"),
    'ActivityPopupRoot should use development activity state and mutate it on claim'
);

assert(
    activityPopupSource.includes('renderLevelRewardData(data, true)')
        && activityPopupSource.includes('deferRenderLevelRewardData(data, false)')
        && activityPopupSource.includes('this.renderRewards(data.rewards, resetToTop)')
        && activityPopupSource.includes('const rewardScrollY = this.getRewardScrollY()')
        && activityPopupSource.includes('this.restoreRewardScrollY(rewardScrollY)')
        && activityPopupSource.includes('updateRewardScrollContentHeight(resetToTop)'),
    'ActivityPopupRoot should preserve LevelReward ScrollView position after claiming a reward'
);

assert(
    homeViewSource.includes('RankButton/RankIcon') && homeViewSource.includes('userData.rankIcon'),
    'HomeView should render the development user rank icon on RankButton'
);

assert(
    homeViewSource.includes('subscribeUserData')
        && homeViewSource.includes('onUserDataChanged')
        && homeViewSource.includes('this.updateUserInfo()'),
    'HomeView should reactively refresh header user resources whenever DataManager userData changes'
);

assert(
    homeViewSource.includes('HeaderContainer/AvatarNode/LevelSprite/LevelLabel')
        && homeViewSource.includes('userData.level'),
    'HomeView should render the logged-in user level on the header avatar level label'
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
    chatUiSource.includes("resources.load('tool/chat/chat_select_tag/spriteFrame'")
        && chatUiSource.includes("resources.load('tool/chat/chat_unselect_tag/spriteFrame'")
        && chatUiSource.includes('Home/HeaderContainer/TopTabs/MsgTab')
        && chatUiSource.includes('Home/HeaderContainer/TopTabs/FriendTab')
        && chatUiSource.includes('Home/HeaderContainer/TopTabs/RecentTab')
        && !chatUiSource.includes('tool/select_tab/spriteFrame')
        && !chatUiSource.includes('tool/unselect_tab/spriteFrame')
        && !chatUiSource.includes('activeTabColor')
        && !chatUiSource.includes('normalTabColor'),
    'ChatUI should switch message page tab sprites with chat_select_tag/chat_unselect_tag only'
);

assert(
    chatUiSource.includes("'Layout')?.getChildByName('CharmIcon'")
        && chatUiSource.includes('getCharmIconPath')
        && chatUiSource.includes('tool/charm/charm')
        && chatUiSource.includes('Math.random() * 18')
        && chatUiSource.includes("tool/rank/bronze")
        && chatUiSource.includes("tool/rank/king")
        && chatUiSource.includes("rankIcon: rank.icon")
        && chatUiSource.includes("rank: rank.name")
        && !chatUiSource.includes('cosmicIcon?:')
        && !chatUiSource.includes('cosmicValue?:'),
    'ChatUI mock friend/recent users should render random charm and rank icons from tool/charm and tool/rank'
);

assert(
    tabBarSource.includes('sprite.enabled = isSelected')
        && tabBarSource.includes('applySelectedBackground')
        && tabBarSource.includes('onGameBarButtonClick')
        && tabBarSource.includes('onChatBarButtonClick')
        && tabBarSource.includes("this.findChildDeep('BarButtons')")
        && tabBarSource.includes("const buttonNames = ['GameBarButton', 'ChatBarButton']"),
    'TabBar should toggle GameBarButton/ChatBarButton preconfigured Sprite backgrounds'
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

const legacyRankingClassName = 'Last' + 'WeekRankingPopupLayer';

assert(
    rankingPopupSource.includes("@ccclass('WeekRankingPopupLayer')")
        && rankingPopupSource.includes('export class WeekRankingPopupLayer')
        && !rankingPopupSource.includes(legacyRankingClassName)
        && gameViewSource.includes('openWeekRankingPopup')
        && gameViewSource.includes('preloadWeekRankingPopup')
        && gameViewSource.includes('getWeekRankingPopupLayer'),
    'weekly ranking popup script, class, and GameView methods should be renamed for current-week ranking'
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
    rankingPopupSource.includes('shouldShowExcisionNode')
        && rankingPopupSource.includes('currentGold <= targetGold')
        && rankingPopupSource.indexOf("this.shouldShowExcisionNode('promotion'") < rankingPopupSource.indexOf("this.addExcisionNode('promotion'")
        && rankingPopupSource.indexOf("this.shouldShowExcisionNode('retention'") < rankingPopupSource.indexOf("this.addExcisionNode('retention'"),
    'ranking popup should hide promotion/retention ExcisionNode once current gold already passes that cutoff'
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
        && rankingPopupSource.includes('dataManager.userData.nickName')
        && rankingPopupSource.includes("'RewardNode/NameLabel'"),
    'ranking popup should refresh the fixed current user ranking item from the logged-in user'
);

assert(
    gameViewSource.includes('preloadWeekRankingPopup')
        && rankingPopupSource.includes('preload()')
        && rankingPopupSource.includes('this.loadRankingData()'),
    'GameView should preload week ranking popup data before the rank button is clicked'
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
    gameViewSource.includes('onRankButtonClick')
        && gameViewSource.includes('Number(dataManager.userData.weeklyBattleGold ?? 0)')
        && gameViewSource.includes('weeklyBattleGold <= 0')
        && gameViewSource.includes('openLastWeekRankingPopup')
        && gameViewSource.includes('getLastWeekRankingPopupLayer')
        && gameViewSource.includes('findLastWeekRankingPopupNode')
        && !gameViewSource.includes('bindRankButtonEvent')
        && !gameViewSource.includes('Button.EventType.CLICK'),
    'GameView should expose manual RankButton handler and route zero weekly gold users to last-week ranking'
);

assert(
    activityPopupSource.includes('if (this.bountyTaskData)')
        && activityPopupSource.includes('bountyTaskChangeCount')
        && activityPopupSource.includes('getBountyTaskChangeCost')
        && activityPopupSource.includes('bountyTaskChangeCosts = [4, 6, 8, 10]')
        && activityPopupSource.includes('dataManager.updateUserData({ diamond: dataManager.userData.diamond - changeCost })'),
    'bounty tasks should persist while logged in and use free/4/6/8/10 diamond refresh costs'
);

assert(
    activityPopupSource.includes('applyBountyTaskRewardIcon')
        && activityPopupSource.includes("this.applyBountyTaskRewardIcon(card, task.rewardType)")
        && activityPopupSource.includes("'TitleNode/IconSprite'")
        && activityPopupSource.includes('this.applyLevelRewardSpriteFrameByType(rewardSprite, rewardType)')
        && activityPopupSource.includes('void this.preloadLevelRewardAssets().then(() => {')
        && !activityPopupSource.includes('this.applyRewardDisplayByType(card, task.rewardType)'),
    'BountyTaskPopupLayer task card icons should use coin_reward/diamond_bg instead of generic reward icons'
);

assert(
    activityPopupSource.indexOf('this.getNextMockDailyCheckInClaimableDayIndex')
        < activityPopupSource.indexOf('claimReward.claimed = true'),
    'mock daily check-in claim should also use the nearest unclaimed day'
);

assert(
    activityPopupSource.indexOf('void this.showRewardPopupForDailyCheckIn()')
        < activityPopupSource.indexOf('private async claimDailyCheckIn')
        && activityPopupSource.indexOf('void this.showRewardPopupForBountyTask(task)')
            < activityPopupSource.indexOf('private async claimBountyTaskReward')
        && activityPopupSource.includes('claimDailyCheckIn(multiplier, diamondCost)')
        && activityPopupSource.includes('claimBountyTaskReward(pending.bountyTask, multiplier, diamondCost)'),
    'daily check-in and completed bounty task receive buttons should open the common reward popup before claiming'
);

assert(
    homeViewSource.includes('hideStartupPopups()'),
    'HomeView should reset popup visibility every time the Home scene starts'
);

assert(
    homeViewSource.includes('LastWeekRankingPopupLayer')
        && homeViewSource.includes('tryShowLastWeekRankingPopupOnceThisWeek')
        && homeViewSource.includes('kapgame_last_week_ranking_popup_shown')
        && homeViewSource.includes('getWeekStartKey')
        && homeViewSource.includes('openAsWeeklyFirstLoginPopup')
        && homeViewSource.includes('findLastWeekRankingPopupNode')
        && homeViewSource.includes('PopupPanel/ContentNode')
        && homeViewSource.includes('PopupPanel/ResourcesPanel'),
    'HomeView should auto show the real last-week settlement ranking once and avoid reward popups with the same node name'
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
    'RewardPopupLayer',
    'RewardPoptoRoot',
    'LastWeekRankingPopupLayer',
    'WeekRankingPopupLayer'
]) {
    assert(
        homeViewSource.includes(`'${popupName}'`),
        `HomeView startup popup reset should include ${popupName}`
    );
}

assert(
    homeSceneSource.includes('"_name": "PopupRoot"')
        && homeSceneSource.includes('"_name": "RewardPopupLayer"')
        && homeSceneSource.includes('"_name": "ResourcesPanel"')
        && homeSceneSource.includes('"_name": "StarEffectNode"')
        && homeSceneSource.includes('"_name": "ItemSprite"')
        && homeSceneSource.includes('"_name": "StandardButton"')
        && homeSceneSource.includes('"_name": "DoubleButton"'),
    'Home.scene should include reward receive popup nodes under PopupRoot/RewardPopupLayer'
);

assert(
    activityPopupSource.includes("this.loadSpriteFrame('tool/reward/halo_ring/spriteFrame')")
        && activityPopupSource.includes("this.loadSpriteFrame('tool/reward/star/spriteFrame')")
        && activityPopupSource.includes('prepareRewardPopupEffectSprites')
        && activityPopupSource.includes('ensureRewardPopupStarNodes')
        && activityPopupSource.includes('new Vec3(0.2, 0.2, 1)')
        && activityPopupSource.includes('new Vec3(1.2, 1.2, 1)')
        && activityPopupSource.includes('new Vec3(1, 1, 1)')
        && activityPopupSource.includes('this.rewardPopupLightSprite')
        && activityPopupSource.includes('this.rewardPopupStarEffectNode'),
    'RewardPopupLayer should animate item scale 0.2 -> 1.2 -> 1.0 with halo_ring and star reward effects'
);

assert(
    activityPopupSource.includes('showRewardPopupForLevelReward')
        && activityPopupSource.includes('claimPendingLevelReward')
        && activityPopupSource.includes('getImmediateLevelRewardData')
        && activityPopupSource.includes('refreshLevelRewardData')
        && activityPopupSource.includes('deferRenderLevelRewardData')
        && activityPopupSource.includes('showRewardedVideoAd')
        && activityPopupSource.includes('rewardPopupDiamondCost = 20')
        && activityPopupSource.includes('onRewardPopupStandardButtonClick')
        && activityPopupSource.includes('onRewardPopupDoubleButtonClick')
        && activityPopupSource.includes('onRewardPopupFiveTimesButtonClick')
        && activityPopupSource.includes('this.claimPendingLevelReward(1)')
        && activityPopupSource.includes('this.claimPendingLevelReward(2, true)')
        && activityPopupSource.includes('this.claimPendingLevelReward(5, false, this.rewardPopupDiamondCost)')
        && activityPopupSource.includes('PopupPanel/ButtonsNode/FiveTimesNode/RewardNode/CountLabel')
        && activityPopupSource.includes('syncAccountResourceLabels')
        && activityPopupSource.includes('subscribeUserData')
        && activityPopupSource.includes('onUserDataChanged')
        && activityPopupSource.includes('HeaderContainer/UserResPanel/ResourcesPanel/DiamondPanel/DiamondLabel')
        && activityPopupSource.includes('Home/HeaderContainer/UserResPanel/ResourcesPanel/DiamondPanel/DiamondLabel')
        && activityPopupSource.includes('HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/GoldLabel')
        && activityPopupSource.includes('Home/HeaderContainer/UserResPanel/ResourcesPanel/GoldPanel/GoldLabel')
        && !activityPopupSource.includes('bindRewardPopupButtons')
        && !activityPopupSource.includes('bindRewardPopupButton')
        && activityPopupSource.includes('resolveRewardPopupNodes')
        && activityPopupSource.includes('PopupRoot/RewardPopupLayer')
        && activityPopupSource.includes('findRewardPopupLayerByStructure')
        && activityPopupSource.includes('StarEffectNode')
        && activityPopupSource.includes('LightSprite')
        && activityPopupSource.includes('DescNode/CountLabel')
        && activityPopupSource.includes('DescNode/NameLabel')
        && activityPopupSource.includes('ButtonsNode/StandardButton')
        && activityPopupSource.includes('ButtonsNode/DoubleButton')
        && activityPopupSource.includes('ButtonsNode/FiveTimesNode')
        && activityPopupSource.includes('playRewardPopupEffects')
        && activityPopupSource.includes('Tween.stopAllByTarget')
        && activityPopupSource.includes('dataManager.userData.diamond')
        && activityPopupSource.includes('dataManager.userData.gold'),
    'ActivityPopupRoot should show the reward receive popup with user currency and star/light effects'
);

assert(
    activityPopupSource.includes('prepareLevelRewardPopup')
        && activityPopupSource.includes('levelRewardRendered')
        && activityPopupSource.includes('if (!this.levelRewardRendered)')
        && activityPopupSource.includes('this.prepareLevelRewardPopup()')
        && activityPopupSource.includes('void this.refreshLevelRewardData(false, true, false)')
        && activityPopupSource.indexOf('this.levelRewardPopupLayer.active = true')
            < activityPopupSource.indexOf('if (!this.levelRewardRendered)')
        && !activityPopupSource.includes('await this.preloadLevelRewardAssets();\n        const data = await this.loadLevelRewardData();'),
    'LevelRewardPopupLayer should be prerendered while hidden so clicking only reveals the ready popup'
);

assert(
    homeUiSource.includes('cachedGameView')
        && homeUiSource.indexOf('(this.cachedGameView as any)?.node?.isValid')
            < homeUiSource.indexOf('this.node.getComponentInChildren(GameView)'),
    'HomeUI should cache GameView so level reward clicks do not scan the whole scene every time'
);

assert(
    activityPopupSource.includes('showRewardPopupForLevelReward')
        && !activityPopupSource.includes('void this.showRewardPopupForLevelReward(reward)'),
    'ActivityPopupRoot should expose reward popup methods for manual binding without auto-registering reward list click events'
);

assert(
    activityPopupSource.indexOf('this.hideRewardPopup(false)')
        < activityPopupSource.indexOf('this.showRewardClaimSuccessToast(pending)')
        && activityPopupSource.indexOf('this.showRewardClaimSuccessToast(pending)')
            < activityPopupSource.indexOf('await this.waitForNextFrame()')
        && activityPopupSource.indexOf('await this.waitForNextFrame()')
            < activityPopupSource.indexOf('const claimed = await this.claimRewardPopupPendingReward(pending, multiplier, diamondCost)')
        && activityPopupSource.includes('this.deferRenderLevelRewardData(data, false)')
        && activityPopupSource.includes('void this.refreshLevelRewardData(false)'),
    'RewardPopupLayer should close, show success immediately, then yield a frame before claim refresh work runs'
);

assert(
    activityPopupSource.includes('const popupLayer = this.rewardPopupLayer')
        && activityPopupSource.includes('const popupRoot = this.rewardPopupRoot')
        && activityPopupSource.indexOf('popupLayer.active = false')
            < activityPopupSource.indexOf('setTimeout(() => this.stopRewardPopupEffects(), 0)')
        && activityPopupSource.indexOf('popupRoot.active = false')
            < activityPopupSource.indexOf('setTimeout(() => this.stopRewardPopupEffects(), 0)')
        && !activityPopupSource.includes('private hideRewardPopup(clearQueue: boolean = true) {\n        this.resolveRewardPopupNodes();\n        this.stopRewardPopupEffects();'),
    'hideRewardPopup should hide cached popup nodes before any node resolving or effect cleanup work'
);

assert(
    activityPopupSource.includes('applyRewardDisplayByType')
        && activityPopupSource.includes('setRewardReceiveButtonLabelByType')
        && activityPopupSource.includes('renderLevelRewardSprites')
        && activityPopupSource.includes('CoinRewardSprite')
        && activityPopupSource.includes('DiamondRewardSprite')
        && activityPopupSource.includes('this.normalizeLevelRewardParts(reward)')
        && activityPopupSource.includes('this.applyRewardDisplayByType(item, reward.rewardType)')
        && activityPopupSource.includes("this.setLabelString(dayNode, ['CountNode/CountLabel'], String(reward.rewardCount))")
        && !activityPopupSource.includes('this.applyRewardDisplayByType(dayNode, reward.rewardType)')
        && activityPopupSource.includes('this.applyBountyTaskRewardIcon(card, task.rewardType)')
        && activityPopupSource.includes('领取${this.getRewardPopupName(this.normalizeRewardType(rewardType))}')
        && activityPopupSource.includes('this.applyRewardSpriteFrameByType(rewardSprite, rewardType)')
        && activityPopupSource.indexOf('this.applyRewardDisplayByType(item, reward.rewardType)')
            < activityPopupSource.indexOf('this.renderLevelRewardSprites(item, reward)')
        && activityPopupSource.indexOf('this.renderLevelRewardSprites(item, reward)')
            < activityPopupSource.indexOf('this.applyRewardReceiveButton(receiveButton, reward)'),
    'reward list items and receive button labels should render the same reward type that is passed to the reward popup'
);

assert(
    activityPopupSource.includes('rewardPopupQueue')
        && activityPopupSource.includes('createLevelRewardPopupPendingRewards')
        && activityPopupSource.includes("part.rewardType === 'GOLD' ? 0 : 1")
        && activityPopupSource.includes('finishLevelRewardClaim')
        && activityPopupSource.includes('pending.rewardType === \'DIAMOND\'')
        && activityPopupSource.includes('this.rewardPopupTenTimeButton.active = canUseDiamondMultiplier')
        && activityPopupSource.includes('钻石奖励不能使用钻石倍数领取')
        && activityPopupSource.includes('this.showRewardPopup(nextPending)'),
    'combined level rewards should claim gold before diamond and disallow diamond-cost multiplier for diamond rewards'
);

assert(
    activityPopupSource.includes('preloadLevelRewardAssets')
        && activityPopupSource.includes('this.preloadLevelRewardAssets()')
        && activityPopupSource.includes("this.loadSpriteFrame('tool/coin_reward/spriteFrame')")
        && activityPopupSource.includes("this.loadSpriteFrame('tool/diamond_bg/spriteFrame')")
        && activityPopupSource.includes('this.levelRewardGoldSpriteFrame')
        && activityPopupSource.includes('this.levelRewardDiamondSpriteFrame')
        && activityPopupSource.includes('applyLevelRewardDisplayByType')
        && activityPopupSource.includes("this.applyLevelRewardPartNode(coinRewardNode, coinPart, 'GOLD')")
        && activityPopupSource.includes("this.applyLevelRewardPartNode(diamondRewardNode, diamondPart, 'DIAMOND')")
        && activityPopupSource.includes('rewardNode.active = part !== null')
        && !activityPopupSource.includes('GeneratedLevelRewardSprite')
        && !activityPopupSource.includes('this.applyRewardDisplayByType(rewardSpriteNode, part.rewardType)')
        && activityPopupSource.indexOf('this.preloadLevelRewardAssets()')
            < activityPopupSource.indexOf('showLevelRewardPopup()'),
    'level reward popup should preload reward assets and use coin_reward/diamond_bg for LevelRewardNode reward sprites'
);

assert(
    homeSceneSource.includes('"_name": "CoinRewardSprite"')
        && homeSceneSource.includes('"_name": "DiamondRewardSprite"'),
    'Home.scene level reward item should contain separate coin and diamond reward nodes'
);

assert(
    homeSceneSource.includes('"_name": "WeekRankingPopupLayer"')
        && homeSceneSource.includes('"_string": "本周排行"'),
    'Home.scene should include WeekRankingPopupLayer node as current-week ranking'
);

assert(
    homeSceneSource.includes('"_name": "LastWeekRankingPopupLayer"')
        && homeSceneSource.includes('"_string": "上周排行"')
        && homeSceneSource.includes('"_name": "ExcisionNode"')
        && homeSceneSource.includes('"_name": "ShareSprite"'),
    'Home.scene should include last-week settlement popup nodes'
);

assert(
    lastWeekRankingPopupSource.includes("@ccclass('LastWeekRankingPopupLayer')")
        && lastWeekRankingPopupSource.includes('export class LastWeekRankingPopupLayer')
        && lastWeekRankingPopupSource.includes("'PopupPanel/ButtonNode/Button'")
        && lastWeekRankingPopupSource.includes('close()')
        && !lastWeekRankingPopupSource.includes('bindNodeClick')
        && lastWeekRankingPopupSource.includes('openAsWeeklyFirstLoginPopup'),
    'last-week ranking popup should expose close/share methods for manual binding and auto-open entry'
);

assert(
    lastWeekRankingPopupSource.includes('PopupPanel/ContentNode/ScrollView/view/content/UserItem')
        && lastWeekRankingPopupSource.includes('PopupPanel/ContentNode/ScrollView/view/content/ExcisionNode')
        && lastWeekRankingPopupSource.includes('this.addCurrentUserMarker()')
        && lastWeekRankingPopupSource.indexOf('this.refreshUserItem(userItem, item, rankNo)')
            < lastWeekRankingPopupSource.indexOf('this.addCurrentUserMarker()'),
    'last-week ranking popup should render the fixed ranking list and place ExcisionNode below current user'
);

assert(
    lastWeekRankingPopupSource.includes('/rank/weekly/last')
        && lastWeekRankingPopupSource.includes('memberCount: 30')
        && lastWeekRankingPopupSource.includes('我上周排名第')
        && lastWeekRankingPopupSource.includes('上周排名'),
    'last-week ranking popup should load/share last-week settlement ranking data'
);
