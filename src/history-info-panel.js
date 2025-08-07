
import { defaultGood, defaultInactiveLight, defaultInactiveDark, stateColors, stateColorsDark, parseColor } from "./history-default-colors.js";
import { infoPanelEnabled, isMobile, HistoryCardState } from "./history-explorer-card.js";

// --------------------------------------------------------------------------------------
// Clone of lit html(), don't want to pull in the entire framework
// --------------------------------------------------------------------------------------

const litHtml = (g) => {
    return (s, ...v) => {
        return { 
            _$litType$ : g,
            strings : s,
            values: v
        };
    }
};

const html = litHtml(1);


// --------------------------------------------------------------------------------------
// HA history more info panel override
// --------------------------------------------------------------------------------------

let hec_panel = {};
    hec_panel.config = null;
    hec_panel.show = undefined;
    hec_panel.entity = null;
    hec_panel.iid = null;
    hec_panel.lc = null;

function hecHookInfoPanel()
{
    let __fn = customElements.get("ha-more-info-history");
    if( !__fn ) return;

    clearInterval(hec_panel.iid);
    hec_panel.iid = null;

    __fn.prototype._databaseCallback = function(valid)
    {
        if( hec_panel.show === undefined ) {

            hec_panel.show = valid;

            if( !valid ) {
                let selector = this.shadowRoot.querySelector('#maincard');
                if( selector ) 
                    selector.style.display = 'none';
            }

        }
    }

    __fn.prototype._setEntityOptions = function(instance)
    {
        const entity_id = this.__entityId;

        const entityOptions = instance.getEntityOptions(entity_id);

        const uom = instance.getUnitOfMeasure(entity_id);
        const sc = instance.getStateClass(entity_id);
        const type = entityOptions?.type ? entityOptions.type : ( sc === 'total_increasing' ) ? 'bar' : ( uom == undefined && sc !== 'measurement' ) ? 'timeline' : 'line';

        // Make sure the panel always starts with the same default graph color
        instance.pconfig.nextDefaultColor = 0;

        // No label area for timelines
        instance.pconfig.labelAreaWidth = ( type == 'timeline' || type == 'arrowline' ) ? 0 : 55;

        // Init entity object
        let entities = [ { 'entity' : entity_id, "process": entityOptions?.process } ];

        // Get the options for line and arrow graphs (use per device_class options if available, otherwise use defaults)
        if( type == 'line' || type == 'arrowline' || type == 'bar' ) {

            if( entityOptions?.color ) {
                entities[0].color = entityOptions?.color;
                entities[0].fill = entityOptions?.fill ?? 'rgba(0,0,0,0)';
            } else {
                const c = instance.getNextDefaultColor();
                entities[0].color = c.color;
                entities[0].fill = entityOptions?.fill ?? c.fill;
            }

            entities[0].width = entityOptions?.width ?? 1.001;
            entities[0].lineMode = entityOptions?.lineMode;
            entities[0].scale = entityOptions?.scale;

            if( type == 'bar' ) {
                entities[0].fill = entities[0].color;
                entities[0].lineMode = entityOptions?.lineMode ?? 'lines';
            }

        }

        const graphs = { 'type': type, 'entities': entities, 'options':entityOptions };

        instance.pconfig.graphConfig = [];
        instance.pconfig.graphConfig.push({ graph: graphs, id:instance.g_id });

        instance.graphs = [];
        for( let g of instance.pconfig.graphConfig ) instance.addFixedGraph(g);
    }

    __fn.prototype._injectHistoryExplorer = function(instance)
    {
            instance.initLocalization();

            instance.insertUIHtmlText(0);

            for( let i = 0; i < 1; i++ ) {

                instance._this.querySelector(`#b1_${i}`)?.addEventListener('click', instance.subDay.bind(instance), false);
                instance._this.querySelector(`#b2_${i}`)?.addEventListener('click', instance.addDay.bind(instance), false);
                instance._this.querySelector(`#b4_${i}`)?.addEventListener('click', instance.decZoom.bind(instance), false);
                instance._this.querySelector(`#b5_${i}`)?.addEventListener('click', instance.incZoom.bind(instance), false);
                instance._this.querySelector(`#bx_${i}`)?.addEventListener('click', instance.todayNoReset.bind(instance), false);
                instance._this.querySelector(`#bx_${i}`)?.addEventListener('dblclick', instance.todayReset.bind(instance), false);
                instance._this.querySelector(`#by_${i}`)?.addEventListener('change', instance.timeRangeSelected.bind(instance));
                instance._this.querySelector(`#bz_${i}`)?.addEventListener('click', instance.toggleZoom.bind(instance), false);
                instance._this.querySelector(`#bo_${i}`)?.addEventListener('click', instance.menuClicked.bind(instance), false);

                instance.ui.dateSelector[i] = instance._this.querySelector(`#bx_${i}`);
                instance.ui.rangeSelector[i] = instance._this.querySelector(`#by_${i}`);
                instance.ui.zoomButton[i] = instance._this.querySelector(`#bz_${i}`);

            }

            if( !isMobile ) 
                instance._this.querySelector('#maincard').addEventListener('wheel', instance.wheelScrolled.bind(instance), { passive: false }); 

            const config = hec_panel.config ?? {};

            instance.g_id = 0;

            instance.pconfig.customStateColors = {};

            instance.stateColors = { ...stateColors };
            instance.stateColorsDark = { ...stateColorsDark };

            instance.stateColors['off']                      = defaultGood;
            instance.stateColors['binary_sensor.multiple']   = '#e5ad23';
            instance.stateColors['battery_charging.off']     = defaultInactiveLight;
            instance.stateColors['plug.off']                 = defaultInactiveLight;
            instance.stateColors['running.off']              = defaultInactiveLight;
            instance.stateColors['update.on']                = defaultInactiveLight;
            instance.stateColorsDark['battery_charging.off'] = defaultInactiveDark;
            instance.stateColorsDark['plug.off']             = defaultInactiveDark;
            instance.stateColorsDark['running.off']          = defaultInactiveDark;
            instance.stateColorsDark['update.on']            = defaultInactiveDark;

            if( config.stateColors ) {
                for( let i in config.stateColors ) {
                    instance.pconfig.customStateColors[i] = parseColor(config.stateColors[i]);
                }
            }

            instance.pconfig.entityOptions = config.entityOptions;

            instance.pconfig.labelsVisible =          false;
            instance.pconfig.cursorMode =             config.cursor?.mode ?? 'hide';
            instance.pconfig.cursorTypes =            config.cursor?.types ?? ['all'];
            instance.pconfig.showTooltipColors[0] =   config.tooltip?.showColorsLine ?? config.showTooltipColorsLine ?? true;
            instance.pconfig.showTooltipColors[1] =   config.tooltip?.showColorsTimeline ?? config.showTooltipColorsTimeline ?? true;
            instance.pconfig.tooltipSize =            config.tooltip?.size ?? config.tooltipSize ?? 'auto';
            instance.pconfig.tooltipShowDuration =    config.tooltip?.showDuration ?? config.tooltipShowDuration ?? true;
            instance.pconfig.tooltipShowLabel =       config.tooltip?.showLabel ?? true;
            instance.pconfig.tooltipStateTextMode =   config.tooltip?.stateTextMode ?? config.stateTextMode ?? 'auto';
            instance.pconfig.colorSeed =              config.stateColorSeed ?? 137;
            instance.pconfig.stateTextMode =          config.stateTextMode ?? 'auto';
            instance.pconfig.decimation =             config.decimation;
            instance.pconfig.roundingPrecision =      config.rounding || 2;
            instance.pconfig.defaultLineMode =        config.lineMode ?? 'lines';
            instance.pconfig.defaultLineWidth =       config.lineWidth ?? 2.0;
            instance.pconfig.showUnavailable =        config.showUnavailable ?? false;
            instance.pconfig.showCurrentValues =      false;
            instance.pconfig.axisAddMarginMin =     ( config.axisAddMarginMin !== undefined ) ? config.axisAddMarginMin : false;
            instance.pconfig.axisAddMarginMax =     ( config.axisAddMarginMax !== undefined ) ? config.axisAddMarginMax : false;
            instance.pconfig.recordedEntitiesOnly =   false;
            instance.pconfig.filterEntities  =        null;
            instance.pconfig.combineSameUnits =       false;
            instance.pconfig.defaultTimeRange =       config.defaultTimeRange ?? '24';
            instance.pconfig.defaultTimeOffset =      config.defaultTimeOffset ?? undefined;
            instance.pconfig.timeTickDensity =        config.timeTicks?.density ?? config.timeTickDensity ?? 'high';
            instance.pconfig.timeTickOverride =       config.timeTicks?.densityOverride ?? undefined;
            instance.pconfig.timeTickShortDate =      config.timeTicks?.dateFormat === 'short';
            instance.pconfig.lineGraphHeight =      ( config.lineGraphHeight ?? 250 ) * 1;
            instance.pconfig.barGraphHeight =       ( config.barGraphHeight ?? 150 ) * 1;
            instance.pconfig.timelineBarHeight =    ( config.timelineBarHeight ?? 24 ) * 1;
            instance.pconfig.timelineBarSpacing =     40;
            instance.pconfig.hideLegend =             true;
            instance.pconfig.refreshEnabled =       ( config.refresh?.automatic !== undefined ) ? config.refresh.automatic : true;
            instance.pconfig.refreshInterval =        undefined;
            instance.statistics.enabled =             config.statistics?.enabled ?? true;
            instance.statistics.mode =                config.statistics?.mode ?? 'mean';
            instance.statistics.retention =           config.statistics?.retention ?? undefined;
            instance.statistics.period =              config.statistics?.period ?? 'hour';
            instance.statistics.force =               undefined;

            instance.ui.darkMode = (instance._hass.selectedTheme && instance._hass.selectedTheme.dark) || (instance._hass.themes && instance._hass.themes.darkMode);
            if( config.uimode ) {
                if( config.uimode === 'dark' ) instance.ui.darkMode = true; else
                if( config.uimode === 'light' ) instance.ui.darkMode = false;
            }

            instance.pconfig.graphLabelColor = parseColor(config.uiColors?.labels ?? (instance.ui.darkMode ? '#9b9b9b' : '#333'));
            instance.pconfig.graphGridColor  = parseColor(config.uiColors?.gridlines ?? (instance.ui.darkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"));
            instance.pconfig.cursorLineColor = parseColor(config.uiColors?.cursorline ?? instance.pconfig.graphGridColor);

            this._setEntityOptions(instance);

            instance.contentValid = true;

            instance.databaseCallback = this._databaseCallback.bind(this);

            instance.setTimeRangeFromString(String(instance.pconfig.defaultTimeRange));

            instance.today(false);

            let ro = new ResizeObserver(entries => { 
                for( let g of instance.graphs ) g.chart.resize(undefined, g.graphHeight);
                instance.setStepSize(true);
            });
            ro.observe(this);
    };

    function getDomainForEntity(entity)
    {
        return entity.substr(0, entity.indexOf("."));
    }

    function getDeviceClass(hass, entity)
    {
        return hass.states[entity]?.attributes?.device_class;
    }

    function getEntityOptions(hass, entityOptions, entity)
    {
        let c = entityOptions?.[entity];
        if( !c ) {
            const dc = getDeviceClass(hass, entity);
            c = dc ? entityOptions?.[dc] : undefined;
            if( !c ) {
                const dm = getDomainForEntity(entity);
                c = dm ? entityOptions?.[dm] : undefined;
            }
        }

        return c ?? undefined;
    }

    function isExcluded(hass, entity_id)
    {
        if( hec_panel?.config?.exclude ) {
            return hec_panel.config.exclude[entity_id] || 
                   hec_panel.config.exclude[getDomainForEntity(entity_id)] || 
                   hec_panel.config.exclude[getDeviceClass(hass, entity_id)];
        }
        return false;
    }

    __fn.prototype._hec_updated = function(changedProps) 
    {

        if( !this.hec_instance ) {

            hec_panel.show = undefined;

            readLocalConfig();

            this.hec_instance = new HistoryCardState();

            this.hec_instance._this = this.shadowRoot;
            this.hec_instance._hass = this.__hass;

            this.hec_instance.version = this.__hass.config.version.split('.').map(Number);

            if( isExcluded(this.__hass, this.__entityId) ) {
                return this._oldUpdated(changedProps);
            }

            this._injectHistoryExplorer(this.hec_instance);

            hec_panel.lc = this.__hass.states[this.__entityId]?.last_changed;

        } else {

            // If the entity changed without reopening the popup, then create a new graph with new settings
            if( this._recreate ) {
                this._recreate = false;
                this._setEntityOptions(this.hec_instance);
                this.hec_instance.updateHistoryWithClearCache();
            }

            const lc = this.__hass.states[this.__entityId]?.last_changed;

            // Update history when the shown entity state changes
            if( hec_panel.lc != lc ) {
                hec_panel.lc = lc;
                if( this.hec_instance.pconfig.refreshEnabled ) {
                    this.hec_instance.cache[this.hec_instance.cacheSize].valid = false;
                    if( this.hec_instance.tid ) clearTimeout(this.hec_instance.tid);
                    this.hec_instance.tid = setTimeout(this.hec_instance.updateHistoryAutoRefresh.bind(this.hec_instance), 2000);
                }
            }

        }
    };

    function calcGraphHeight(type)
    {
        switch( type ) {
            case 'line': return hec_panel?.config?.lineGraphHeight ?? 250;
            case 'bar': return (hec_panel?.config?.barGraphHeight ?? 150) + 24;
            default: return 90;
        }
    }

    __fn.prototype._hec_render = function() 
    {
        if( !this.hec_instance ) 
            readLocalConfig();

        const entity_id = this.__entityId;

        if( isExcluded(this.__hass, entity_id) ) {
            return this._oldRender();
        }

        const entityOptions = getEntityOptions(this.__hass, hec_panel?.config?.entityOptions, entity_id);

        const uom = this.__hass.states[entity_id]?.attributes?.unit_of_measurement;
        const sc = this.__hass.states[entity_id]?.attributes?.state_class;
        const type = entityOptions?.type ? entityOptions.type : ( sc === 'total_increasing' ) ? 'bar' : ( uom == undefined && sc !== 'measurement' ) ? 'timeline' : 'line';

        const h = calcGraphHeight(type);

        const optColor = 'var(--primary-text-color)';
        const optBack = 'var(--card-background-color)';

        const bgcol = parseColor(hec_panel?.config?.uiColors?.buttons ?? getComputedStyle(document.body).getPropertyValue('--primary-color') + '1f');
        const cbcol = parseColor(hec_panel?.config?.uiColors?.closeButton ?? '#0000001f');
        const tools = hec_panel?.config?.uiLayout?.toolbar != 'hide';
        const invertZoom = hec_panel?.config?.uiLayout?.invertZoom === true;
        const interval = hec_panel?.config?.uiLayout?.interval != 'hide';

        if( hec_panel.entity !== this.__entityId ) {
            hec_panel.entity = this.__entityId;
            hec_panel.show = undefined;
            if( this.hec_instance ) this._recreate = true;
        }

        const i = 0;

        if( tools ) {

            return html`
                <div id="maincard" style="display:${(hec_panel.show === false) ? 'none' : 'block'};margin-bottom: 16px">
                <div style="margin-bottom:10px;width:100%;min-height:30px;text-align:center;display:block;line-height:normal;">
                    <div id="dl_${i}" style="background-color:${bgcol};float:left;margin-left:${isMobile ? -12 : -4}px;display:inline-block;padding-left:10px;padding-right:10px;">
                        <button id="b1_${i}" style="margin:0px;border:0px solid black;color:inherit;background-color:#00000000;height:30px"><</button>
                        <button id="bx_${i}" style="margin:0px;border:0px solid black;color:inherit;background-color:#00000000;height:30px">-</button>
                        <button id="b2_${i}" style="margin:0px;border:0px solid black;color:inherit;background-color:#00000000;height:30px">></button>
                    </div>
                    <div id="dr_${i}" style="background-color:${bgcol};float:right;margin-right:${isMobile ? -12 : -4}px;display:inline-block;padding-left:${isMobile ? 5 : 10}px;padding-right:10px;">
                        <button id="bz_${i}" style="margin:0px;border:0px solid black;color:inherit;background-color:#00000000"><svg width="24" height="24" viewBox="0 0 24 24" style="vertical-align:middle;"><path fill="var(--primary-text-color)" d="M15.5,14L20.5,19L19,20.5L14,15.5V14.71L13.73,14.43C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.43,13.73L14.71,14H15.5M9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14M12,10H10V12H9V10H7V9H9V7H10V9H12V10Z" /></svg></button>
                        <button id="b${invertZoom ? 5 : 4}_${i}" style="margin:0px;border:0px solid black;color:inherit;background-color:#00000000;height:30px">-</button>
                        <select id="by_${i}" style="margin:0px;border:0px solid black;color:inherit;background-color:#00000000;height:30px;max-width:83px">
                            <option value="0" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="1" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="2" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="3" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="4" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="5" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="6" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="7" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="8" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="9" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="10" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="11" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="12" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="24" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="48" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="72" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="96" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="120" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="144" style="color:${optColor};background-color:${optBack}" hidden></option>
                            <option value="168" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="336" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="504" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="720" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="2184" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="4368" style="color:${optColor};background-color:${optBack}"></option>
                            <option value="8760" style="color:${optColor};background-color:${optBack}"></option>
                        </select>
                        <button id="b${invertZoom ? 4 : 5}_${i}" style="margin:0px;border:0px solid black;color:inherit;background-color:#00000000;height:30px">+</button>
                    </div>
                </div>
                <div id='graphlist' style="margin-left:-2px;margin-right:-10px">
                    <div>
                        <select id='bd-0' style="display:${(type == 'bar' && interval) ? 'block' : 'none'};position:relative;float:right;width:80px;right:10px;color:var(--primary-text-color);background-color:${cbcol};border:0px solid black;">
                            <option value="0" style="color:${optColor};background-color:${optBack}">10m</option>
                            <option value="1" style="color:${optColor};background-color:${optBack}" selected>Hourly</option>
                            <option value="2" style="color:${optColor};background-color:${optBack}">Daily</option>
                            <option value="3" style="color:${optColor};background-color:${optBack}">Monthly</option>
                            <option value="4" style="color:${optColor};background-color:${optBack}">As line</option>
                        </select>
                        <button id='ca-0' style="display:${(type == 'line' || type == 'bar') ? 'block' : 'none'};position:absolute;margin-left:-12px;background:none;opacity:1.0;border:0px solid black;">
                            <svg style='display:none' width="18" height="18" viewBox="0 0 24 24"><path fill="var(--primary-text-color)" d="M12,17C10.89,17 10,16.1 10,15C10,13.89 10.89,13 12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17M18,20V10H6V20H18M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z" /></svg>
                        </button>
                        <canvas id="graph0" height="${h}px" style='touch-action:pan-y'></canvas>
                    </div>
                </div>
                </div>
                `;

        } else {

            return html`
                <div id="maincard" style="display:${(hec_panel.show === false) ? 'none' : 'block'};margin-bottom: 16px">
                <div id='graphlist' style="margin-left:-2px;margin-right:-10px">
                    <div>
                        <select id='bd-0' style="display:${(type == 'bar' && interval) ? 'block' : 'none'};position:relative;float:right;width:80px;right:10px;color:var(--primary-text-color);background-color:${cbcol};border:0px solid black;">
                            <option value="0" style="color:${optColor};background-color:${optBack}">10m</option>
                            <option value="1" style="color:${optColor};background-color:${optBack}" selected>Hourly</option>
                            <option value="2" style="color:${optColor};background-color:${optBack}">Daily</option>
                            <option value="3" style="color:${optColor};background-color:${optBack}">Monthly</option>
                            <option value="4" style="color:${optColor};background-color:${optBack}">As line</option>
                        </select>
                        <button id='ca-0' style="display:${(type == 'line' || type == 'bar') ? 'block' : 'none'};position:absolute;margin-top:-6px;margin-left:-12px;background:none;opacity:1.0;border:0px solid black;">
                            <svg style='display:none' width="18" height="18" viewBox="0 0 24 24"><path fill="var(--primary-text-color)" d="M12,17C10.89,17 10,16.1 10,15C10,13.89 10.89,13 12,13A2,2 0 0,1 14,15A2,2 0 0,1 12,17M18,20V10H6V20H18M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6C4.89,22 4,21.1 4,20V10C4,8.89 4.89,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z" /></svg>
                        </button>
                        <canvas id="graph0" height="${h}px" style='touch-action:pan-y'></canvas>
                    </div>
                </div>
                </div>
                `;

        }
    };

    function readLocalConfig()
    {
        let data = JSON.parse(window.localStorage.getItem('history-explorer-info-panel'));
        if( data )
            hec_panel.config = data.config;
    }

    if( infoPanelEnabled ) {
        __fn.prototype._oldUpdated = __fn.prototype.updated;
        __fn.prototype._oldRender = __fn.prototype.render;
        __fn.prototype.updated = __fn.prototype._hec_updated;
        __fn.prototype.render = __fn.prototype._hec_render;
    }

}

hec_panel.iid = setInterval(hecHookInfoPanel, 100);

