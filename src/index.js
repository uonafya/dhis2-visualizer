import '../extjs/resources/css/ext-all-gray.css';
import './css/style.css';
import './css/meringue.css';
import 'd2-analysis/css/ui/GridHeaders.css';

import isString from 'd2-utilizr/lib/isString';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayTo from 'd2-utilizr/lib/arrayTo';

import { api, chart, manager, config, ui, init } from 'd2-analysis';

import { Layout } from './api/Layout';

import { LayoutWindow } from './ui/LayoutWindow.js';
import { OptionsWindow } from './ui/OptionsWindow.js';

// extend
api.Layout = Layout;

// references
var refs = {
    api,
    chart
};

    // dimension config
var dimensionConfig = new config.DimensionConfig();
refs.dimensionConfig = dimensionConfig;

    // option config
var optionConfig = new config.OptionConfig();
refs.optionConfig = optionConfig;

    // period config
var periodConfig = new config.PeriodConfig();
refs.periodConfig = periodConfig;

    // ui config
var chartConfig = new config.ChartConfig();
refs.chartConfig = chartConfig;

    // chart config
var uiConfig = new config.UiConfig();
refs.uiConfig = uiConfig;

    // app manager
var appManager = new manager.AppManager();
refs.appManager = appManager;

    // calendar manager
var calendarManager = new manager.CalendarManager(refs);
refs.calendarManager = calendarManager;

    // request manager
var requestManager = new manager.RequestManager(refs);
refs.requestManager = requestManager;

    // i18n manager
var i18nManager = new manager.I18nManager(refs);
refs.i18nManager = i18nManager;

    // sessionstorage manager
var sessionStorageManager = new manager.SessionStorageManager(refs);
refs.sessionStorageManager = sessionStorageManager;

    // ui manager
var uiManager = new manager.UiManager(refs);
refs.uiManager = uiManager;

    // instance manager
var instanceManager = new manager.InstanceManager(refs);
refs.instanceManager = instanceManager;

    // table manager
var tableManager = new manager.TableManager(refs);
refs.tableManager = tableManager;

// dependencies

    // instance manager
uiManager.setInstanceManager(instanceManager);

    // i18n manager
dimensionConfig.setI18nManager(i18nManager);
optionConfig.setI18nManager(i18nManager);
periodConfig.setI18nManager(i18nManager);
uiManager.setI18nManager(i18nManager);

    // static
appManager.applyTo([].concat(arrayTo(api), arrayTo(chart)));
instanceManager.applyTo(arrayTo(api));
uiManager.applyTo(arrayTo(api));
dimensionConfig.applyTo(arrayTo(chart));
optionConfig.applyTo([].concat(arrayTo(api), arrayTo(chart)));

// requests
var manifestReq = $.ajax({
    url: 'manifest.webapp',
    dataType: 'text',
    headers: {
        'Accept': 'text/plain; charset=utf-8'
    }
});

var systemInfoUrl = '/api/system/info.json';
var systemSettingsUrl = '/api/systemSettings.json?key=keyCalendar&key=keyDateFormat&key=keyAnalysisRelativePeriod&key=keyHideUnapprovedDataInAnalytics&key=keyAnalysisDigitGroupSeparator';
var userAccountUrl = '/api/me/user-account.json';

var systemInfoReq;
var systemSettingsReq;
var userAccountReq;

manifestReq.done(function(text) {
    appManager.manifest = JSON.parse(text);
    appManager.env = process.env.NODE_ENV;
    appManager.setAuth();
    systemInfoReq = $.getJSON(appManager.getPath() + systemInfoUrl);

systemInfoReq.done(function(systemInfo) {
    appManager.systemInfo = systemInfo;
    appManager.path = systemInfo.contextPath;
    systemSettingsReq = $.getJSON(appManager.getPath() + systemSettingsUrl);

systemSettingsReq.done(function(systemSettings) {
    appManager.systemSettings = systemSettings;
    userAccountReq = $.getJSON(appManager.getPath() + userAccountUrl);

userAccountReq.done(function(userAccount) {
    appManager.userAccount = userAccount;
    calendarManager.setBaseUrl(appManager.getPath());
    calendarManager.setDateFormat(appManager.getDateFormat());
    calendarManager.init(appManager.systemSettings.keyCalendar);

requestManager.add(new api.Request(init.i18nInit(refs)));
requestManager.add(new api.Request(init.authViewUnapprovedDataInit(refs)));
requestManager.add(new api.Request(init.rootNodesInit(refs)));
requestManager.add(new api.Request(init.organisationUnitLevelsInit(refs)));
requestManager.add(new api.Request(init.legendSetsInit(refs)));
requestManager.add(new api.Request(init.dimensionsInit(refs)));
requestManager.add(new api.Request(init.dataApprovalLevelsInit(refs)));

requestManager.set(initialize);
requestManager.run();

});});});});

function initialize() {

    // app manager
    appManager.appName = 'Data Visualizer';
    appManager.sessionName = 'chart';

    // instance manager
    instanceManager.apiResource = 'charts';
    instanceManager.dataStatisticsEventType = 'CHART_VIEW';

    // ui manager
    uiManager.disableRightClick();

    uiManager.enableConfirmUnload();

    uiManager.setIntroHtml(function() {
        return '<div class="ns-viewport-text" style="padding:20px">' +
            '<h3>' + i18nManager.get('example1') + '</h3>' +
            '<div>- ' + i18nManager.get('example2') + '</div>' +
            '<div>- ' + i18nManager.get('example3') + '</div>' +
            '<div>- ' + i18nManager.get('example4') + '</div>' +
            '<h3 style="padding-top:20px">' + i18nManager.get('example5') + '</h3>' +
            '<div>- ' + i18nManager.get('example6') + '</div>' +
            '<div>- ' + i18nManager.get('example7') + '</div>' +
            '<div>- ' + i18nManager.get('example8') + '</div>' +
            '</div>';
    }());

    // instance manager
    instanceManager.setFn(function(layout) {
        var chartObject = chart.Chart({
            refs,
            layout
        });

        // render
        uiManager.add(chartObject);

        // reg
        uiManager.reg(chartObject, 'chart');

        // mask
        uiManager.unmask();

        // statistics
        instanceManager.postDataStatistics();
    });

    // windows
    uiManager.reg(LayoutWindow(refs), 'layoutWindow').hide();

    uiManager.reg(OptionsWindow(refs), 'optionsWindow').hide();

    uiManager.reg(ui.FavoriteWindow(refs), 'favoriteWindow').hide();

    // north
    var northRegion = uiManager.reg(ui.NorthRegion(refs), 'northRegion');

    // viewport
    uiManager.reg(ui.Viewport(refs, {
        northRegion: northRegion,
        chartTypeToolbar: ui.ChartTypeToolbar(refs)
    }), 'viewport');

    uiManager.getUpdateComponent().on('resize', function(cmp, width) {
        var chart = uiManager.get('chart');

        if (chart) {
            chart.onViewportResize();
        }

        if (width < 700 && cmp.fullSize) {
            cmp.toggleCmp();
            cmp.fullSize = false;
        }
        else if (width >= 700 && !this.fullSize) {
            cmp.toggleCmp(true);
            cmp.fullSize = true;
        }
    });
}

global.refs = refs;
