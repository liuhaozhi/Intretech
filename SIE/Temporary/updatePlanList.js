/**
 *@NApiVersion 2.x
 *@NScriptType ScheduledScript
 */

define(['N/record', 'N/search'],
function(record, search) {
    var items = [{
    custrecord_p_custcol_salesorder: '21409',
    custrecord_p_custcol_plan_number: 'XM37081',
    custrecord_quantity_shipped: '4',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20943',
    custrecord_p_custcol_plan_number: 'XM32491',
    custrecord_quantity_shipped: '7',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21302',
    custrecord_p_custcol_plan_number: 'XM36011',
    custrecord_quantity_shipped: '64',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20945',
    custrecord_p_custcol_plan_number: 'XM32511',
    custrecord_quantity_shipped: '25',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21462',
    custrecord_p_custcol_plan_number: 'XM37611',
    custrecord_quantity_shipped: '104',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20822',
    custrecord_p_custcol_plan_number: 'XM31284',
    custrecord_quantity_shipped: '300',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '22719',
    custrecord_p_custcol_plan_number: 'XM48531',
    custrecord_quantity_shipped: '1200',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21004',
    custrecord_p_custcol_plan_number: 'XM33121',
    custrecord_quantity_shipped: '60000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18413',
    custrecord_p_custcol_plan_number: 'XM23592',
    custrecord_quantity_shipped: '572',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18413',
    custrecord_p_custcol_plan_number: 'XM23591',
    custrecord_quantity_shipped: '572',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21819',
    custrecord_p_custcol_plan_number: 'XM41171',
    custrecord_quantity_shipped: '1880',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18521',
    custrecord_p_custcol_plan_number: 'XM24671',
    custrecord_quantity_shipped: '428',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18521',
    custrecord_p_custcol_plan_number: 'XM24672',
    custrecord_quantity_shipped: '428',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18454',
    custrecord_p_custcol_plan_number: 'XM24001',
    custrecord_quantity_shipped: '2',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18491',
    custrecord_p_custcol_plan_number: 'XM24371',
    custrecord_quantity_shipped: '4',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18487',
    custrecord_p_custcol_plan_number: 'XM24331',
    custrecord_quantity_shipped: '2',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21823',
    custrecord_p_custcol_plan_number: 'XM41211',
    custrecord_quantity_shipped: '1979',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18560',
    custrecord_p_custcol_plan_number: 'XM25061',
    custrecord_quantity_shipped: '13',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20773',
    custrecord_p_custcol_plan_number: 'XM30791',
    custrecord_quantity_shipped: '864',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '20769',
    custrecord_p_custcol_plan_number: 'XM30761',
    custrecord_quantity_shipped: '80',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19067',
    custrecord_p_custcol_plan_number: 'XM27181',
    custrecord_quantity_shipped: '500',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18559',
    custrecord_p_custcol_plan_number: 'XM25051',
    custrecord_quantity_shipped: '12',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20887',
    custrecord_p_custcol_plan_number: 'XM31921',
    custrecord_quantity_shipped: '96',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20826',
    custrecord_p_custcol_plan_number: 'XM31321',
    custrecord_quantity_shipped: '1800',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20728',
    custrecord_p_custcol_plan_number: 'XM30341',
    custrecord_quantity_shipped: '380',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21802',
    custrecord_p_custcol_plan_number: 'XM41001',
    custrecord_quantity_shipped: '500',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '20828',
    custrecord_p_custcol_plan_number: 'XM31351',
    custrecord_quantity_shipped: '1656',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19043',
    custrecord_p_custcol_plan_number: 'XM26941',
    custrecord_quantity_shipped: '3960',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19062',
    custrecord_p_custcol_plan_number: 'XM27131',
    custrecord_quantity_shipped: '3384',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21536',
    custrecord_p_custcol_plan_number: 'XM38351',
    custrecord_quantity_shipped: '2000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20971',
    custrecord_p_custcol_plan_number: 'XM32771',
    custrecord_quantity_shipped: '432',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20883',
    custrecord_p_custcol_plan_number: 'XM31891',
    custrecord_quantity_shipped: '528',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18457',
    custrecord_p_custcol_plan_number: 'XM24031',
    custrecord_quantity_shipped: '2',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18458',
    custrecord_p_custcol_plan_number: 'XM24041',
    custrecord_quantity_shipped: '4',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21278',
    custrecord_p_custcol_plan_number: 'XM35771',
    custrecord_quantity_shipped: '364',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20890',
    custrecord_p_custcol_plan_number: 'XM31961',
    custrecord_quantity_shipped: '12',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20879',
    custrecord_p_custcol_plan_number: 'XM31851',
    custrecord_quantity_shipped: '759',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20853',
    custrecord_p_custcol_plan_number: 'XM31591',
    custrecord_quantity_shipped: '320',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18459',
    custrecord_p_custcol_plan_number: 'XM24051',
    custrecord_quantity_shipped: '4',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18461',
    custrecord_p_custcol_plan_number: 'XM24071',
    custrecord_quantity_shipped: '5',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21410',
    custrecord_p_custcol_plan_number: 'XM37091',
    custrecord_quantity_shipped: '584',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18492',
    custrecord_p_custcol_plan_number: 'XM24381',
    custrecord_quantity_shipped: '10',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18495',
    custrecord_p_custcol_plan_number: 'XM24411',
    custrecord_quantity_shipped: '10',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20852',
    custrecord_p_custcol_plan_number: 'XM31581',
    custrecord_quantity_shipped: '819',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21374',
    custrecord_p_custcol_plan_number: 'XM36731',
    custrecord_quantity_shipped: '120',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21531',
    custrecord_p_custcol_plan_number: 'XM38301',
    custrecord_quantity_shipped: '100',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20855',
    custrecord_p_custcol_plan_number: 'XM31611',
    custrecord_quantity_shipped: '949',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '20866',
    custrecord_p_custcol_plan_number: 'XM31721',
    custrecord_quantity_shipped: '615',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18488',
    custrecord_p_custcol_plan_number: 'XM24341',
    custrecord_quantity_shipped: '2',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20944',
    custrecord_p_custcol_plan_number: 'XM32501',
    custrecord_quantity_shipped: '468',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21290',
    custrecord_p_custcol_plan_number: 'XM35891',
    custrecord_quantity_shipped: '1776',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '20950',
    custrecord_p_custcol_plan_number: 'XM32561',
    custrecord_quantity_shipped: '2',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21275',
    custrecord_p_custcol_plan_number: 'XM35741',
    custrecord_quantity_shipped: '1000',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21417',
    custrecord_p_custcol_plan_number: 'XM37161',
    custrecord_quantity_shipped: '560',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18717',
    custrecord_p_custcol_plan_number: 'XM25631',
    custrecord_quantity_shipped: '7200',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33567',
    custrecord_p_custcol_plan_number: 'ORDXM51561',
    custrecord_quantity_shipped: '4',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33568',
    custrecord_p_custcol_plan_number: 'ORDXM51571',
    custrecord_quantity_shipped: '4',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20951',
    custrecord_p_custcol_plan_number: 'XM32571',
    custrecord_quantity_shipped: '498',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20865',
    custrecord_p_custcol_plan_number: 'XM31711',
    custrecord_quantity_shipped: '384',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20870',
    custrecord_p_custcol_plan_number: 'XM31761',
    custrecord_quantity_shipped: '480',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20880',
    custrecord_p_custcol_plan_number: 'XM31861',
    custrecord_quantity_shipped: '3525',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '20882',
    custrecord_p_custcol_plan_number: 'XM31871',
    custrecord_quantity_shipped: '1008',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20885',
    custrecord_p_custcol_plan_number: 'XM31911',
    custrecord_quantity_shipped: '840',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20921',
    custrecord_p_custcol_plan_number: 'XM32271',
    custrecord_quantity_shipped: '288',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21608',
    custrecord_p_custcol_plan_number: 'XM39071',
    custrecord_quantity_shipped: '1000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20929',
    custrecord_p_custcol_plan_number: 'XM32351',
    custrecord_quantity_shipped: '672',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20888',
    custrecord_p_custcol_plan_number: 'XM31941',
    custrecord_quantity_shipped: '384',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20930',
    custrecord_p_custcol_plan_number: 'XM32361',
    custrecord_quantity_shipped: '144',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21431',
    custrecord_p_custcol_plan_number: 'XM37301',
    custrecord_quantity_shipped: '9212',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20969',
    custrecord_p_custcol_plan_number: 'XM32751',
    custrecord_quantity_shipped: '376',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18733',
    custrecord_p_custcol_plan_number: 'XM25841',
    custrecord_quantity_shipped: '2016',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '20017',
    custrecord_p_custcol_plan_number: 'XM29871',
    custrecord_quantity_shipped: '5000',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21788',
    custrecord_p_custcol_plan_number: 'XM40861',
    custrecord_quantity_shipped: '50',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '20790',
    custrecord_p_custcol_plan_number: 'XM30961',
    custrecord_quantity_shipped: '1920',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21415',
    custrecord_p_custcol_plan_number: 'XM37151',
    custrecord_quantity_shipped: '1020',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21287',
    custrecord_p_custcol_plan_number: 'XM35861',
    custrecord_quantity_shipped: '792',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18719',
    custrecord_p_custcol_plan_number: 'XM256572',
    custrecord_quantity_shipped: '120000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18719',
    custrecord_p_custcol_plan_number: 'XM256581',
    custrecord_quantity_shipped: '30000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18719',
    custrecord_p_custcol_plan_number: 'XM2565120',
    custrecord_quantity_shipped: '60000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18719',
    custrecord_p_custcol_plan_number: 'XM2565109',
    custrecord_quantity_shipped: '150000',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18719',
    custrecord_p_custcol_plan_number: 'XM2565110',
    custrecord_quantity_shipped: '60000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18719',
    custrecord_p_custcol_plan_number: 'XM256594',
    custrecord_quantity_shipped: '60000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18719',
    custrecord_p_custcol_plan_number: 'XM256596',
    custrecord_quantity_shipped: '30000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18586',
    custrecord_p_custcol_plan_number: 'XM25321',
    custrecord_quantity_shipped: '3',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21291',
    custrecord_p_custcol_plan_number: 'XM35901',
    custrecord_quantity_shipped: '236',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19041',
    custrecord_p_custcol_plan_number: 'XM2692172',
    custrecord_quantity_shipped: '2570',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19041',
    custrecord_p_custcol_plan_number: 'XM2692173',
    custrecord_quantity_shipped: '2624',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18591',
    custrecord_p_custcol_plan_number: 'XM25371',
    custrecord_quantity_shipped: '3',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21203',
    custrecord_p_custcol_plan_number: 'XM35021',
    custrecord_quantity_shipped: '596',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21480',
    custrecord_p_custcol_plan_number: 'XM37791',
    custrecord_quantity_shipped: '136',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18588',
    custrecord_p_custcol_plan_number: 'XM25341',
    custrecord_quantity_shipped: '3',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21221',
    custrecord_p_custcol_plan_number: 'XM35211',
    custrecord_quantity_shipped: '272',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21986',
    custrecord_p_custcol_plan_number: 'XM42831',
    custrecord_quantity_shipped: '828',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '22077',
    custrecord_p_custcol_plan_number: 'XM43751',
    custrecord_quantity_shipped: '2232',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21347',
    custrecord_p_custcol_plan_number: 'XM36461',
    custrecord_quantity_shipped: '100',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21256',
    custrecord_p_custcol_plan_number: 'XM35551',
    custrecord_quantity_shipped: '284',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21999',
    custrecord_p_custcol_plan_number: 'XM42971',
    custrecord_quantity_shipped: '3024',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21232',
    custrecord_p_custcol_plan_number: 'XM35311',
    custrecord_quantity_shipped: '156',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '22013',
    custrecord_p_custcol_plan_number: 'XM43111',
    custrecord_quantity_shipped: '576',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21518',
    custrecord_p_custcol_plan_number: 'XM38171',
    custrecord_quantity_shipped: '332',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '22916',
    custrecord_p_custcol_plan_number: 'XM48721',
    custrecord_quantity_shipped: '2304',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21511',
    custrecord_p_custcol_plan_number: 'XM38101',
    custrecord_quantity_shipped: '100',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '22920',
    custrecord_p_custcol_plan_number: 'XM48761',
    custrecord_quantity_shipped: '864',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19790',
    custrecord_p_custcol_plan_number: 'XM28601',
    custrecord_quantity_shipped: '1512',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21535',
    custrecord_p_custcol_plan_number: 'XM38341',
    custrecord_quantity_shipped: '1920',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21606',
    custrecord_p_custcol_plan_number: 'XM39051',
    custrecord_quantity_shipped: '700',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21841',
    custrecord_p_custcol_plan_number: 'XM41391',
    custrecord_quantity_shipped: '189',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21243',
    custrecord_p_custcol_plan_number: 'XM35421',
    custrecord_quantity_shipped: '160',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21599',
    custrecord_p_custcol_plan_number: 'XM38971',
    custrecord_quantity_shipped: '200',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18766',
    custrecord_p_custcol_plan_number: 'XM261713',
    custrecord_quantity_shipped: '60000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18765',
    custrecord_p_custcol_plan_number: 'XM261614',
    custrecord_quantity_shipped: '9000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18520',
    custrecord_p_custcol_plan_number: 'XM24661',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18764',
    custrecord_p_custcol_plan_number: 'XM261513',
    custrecord_quantity_shipped: '60000',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21188',
    custrecord_p_custcol_plan_number: 'XM34871',
    custrecord_quantity_shipped: '28',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18569',
    custrecord_p_custcol_plan_number: 'XM25151',
    custrecord_quantity_shipped: '5000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21189',
    custrecord_p_custcol_plan_number: 'XM34881',
    custrecord_quantity_shipped: '72',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19344',
    custrecord_p_custcol_plan_number: 'XM27951',
    custrecord_quantity_shipped: '8358',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19820',
    custrecord_p_custcol_plan_number: 'XM28901',
    custrecord_quantity_shipped: '5000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19075',
    custrecord_p_custcol_plan_number: 'XM27261',
    custrecord_quantity_shipped: '5100',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21461',
    custrecord_p_custcol_plan_number: 'XM37591',
    custrecord_quantity_shipped: '96',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18568',
    custrecord_p_custcol_plan_number: 'XM25141',
    custrecord_quantity_shipped: '15400',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21375',
    custrecord_p_custcol_plan_number: 'XM36741',
    custrecord_quantity_shipped: '312',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18574',
    custrecord_p_custcol_plan_number: 'XM25201',
    custrecord_quantity_shipped: '3480',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18571',
    custrecord_p_custcol_plan_number: 'XM25171',
    custrecord_quantity_shipped: '1100',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21301',
    custrecord_p_custcol_plan_number: 'XM36001',
    custrecord_quantity_shipped: '68',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21752',
    custrecord_p_custcol_plan_number: 'XM40511',
    custrecord_quantity_shipped: '204',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18773',
    custrecord_p_custcol_plan_number: 'XM26244',
    custrecord_quantity_shipped: '18000',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21587',
    custrecord_p_custcol_plan_number: 'XM38861',
    custrecord_quantity_shipped: '300',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM260922',
    custrecord_quantity_shipped: '2016',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM260911',
    custrecord_quantity_shipped: '6200',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM2609102',
    custrecord_quantity_shipped: '20000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM260991',
    custrecord_quantity_shipped: '23807',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM260992',
    custrecord_quantity_shipped: '22895',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM260912',
    custrecord_quantity_shipped: '21600',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM260913',
    custrecord_quantity_shipped: '21600',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM26099',
    custrecord_quantity_shipped: '1000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM260914',
    custrecord_quantity_shipped: '9000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM260926',
    custrecord_quantity_shipped: '100000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM2609104',
    custrecord_quantity_shipped: '18000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18758',
    custrecord_p_custcol_plan_number: 'XM2609122',
    custrecord_quantity_shipped: '17984',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18772',
    custrecord_p_custcol_plan_number: 'XM262310',
    custrecord_quantity_shipped: '12000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21537',
    custrecord_p_custcol_plan_number: 'XM38361',
    custrecord_quantity_shipped: '4000',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18774',
    custrecord_p_custcol_plan_number: 'XM262510',
    custrecord_quantity_shipped: '42000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18781',
    custrecord_p_custcol_plan_number: 'XM263210',
    custrecord_quantity_shipped: '12000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21363',
    custrecord_p_custcol_plan_number: 'XM36631',
    custrecord_quantity_shipped: '4000',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19068',
    custrecord_p_custcol_plan_number: 'XM27195',
    custrecord_quantity_shipped: '47712',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19337',
    custrecord_p_custcol_plan_number: 'XM27881',
    custrecord_quantity_shipped: '8985',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18727',
    custrecord_p_custcol_plan_number: 'XM25731',
    custrecord_quantity_shipped: '2880',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19081',
    custrecord_p_custcol_plan_number: 'XM27321',
    custrecord_quantity_shipped: '7704',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19077',
    custrecord_p_custcol_plan_number: 'XM27281',
    custrecord_quantity_shipped: '1792',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19087',
    custrecord_p_custcol_plan_number: 'XM27381',
    custrecord_quantity_shipped: '10073',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19310',
    custrecord_p_custcol_plan_number: 'XM27611',
    custrecord_quantity_shipped: '2880',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '22040',
    custrecord_p_custcol_plan_number: 'XM43381',
    custrecord_quantity_shipped: '1188',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19340',
    custrecord_p_custcol_plan_number: 'XM27911',
    custrecord_quantity_shipped: '4800',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '21310',
    custrecord_p_custcol_plan_number: 'XM36101',
    custrecord_quantity_shipped: '450',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18542',
    custrecord_p_custcol_plan_number: 'XM24881',
    custrecord_quantity_shipped: '1576',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM2676153',
    custrecord_quantity_shipped: '1800',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267666',
    custrecord_quantity_shipped: '27250',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267661',
    custrecord_quantity_shipped: '1770',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267662',
    custrecord_quantity_shipped: '8500',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM2676150',
    custrecord_quantity_shipped: '27250',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267647',
    custrecord_quantity_shipped: '500',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267652',
    custrecord_quantity_shipped: '696',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267653',
    custrecord_quantity_shipped: '1250',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267650',
    custrecord_quantity_shipped: '4000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267655',
    custrecord_quantity_shipped: '1030',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM2676176',
    custrecord_quantity_shipped: '11105',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM2676183',
    custrecord_quantity_shipped: '7700',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM2676174',
    custrecord_quantity_shipped: '2535',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19031',
    custrecord_p_custcol_plan_number: 'XM26824',
    custrecord_quantity_shipped: '5205',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM51581',
    custrecord_quantity_shipped: '2000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM51582',
    custrecord_quantity_shipped: '9634',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM51583',
    custrecord_quantity_shipped: '6854',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM51584',
    custrecord_quantity_shipped: '6028',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM51585',
    custrecord_quantity_shipped: '4934',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM51586',
    custrecord_quantity_shipped: '220',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM51587',
    custrecord_quantity_shipped: '9772',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM51588',
    custrecord_quantity_shipped: '1000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM51589',
    custrecord_quantity_shipped: '7724',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515810',
    custrecord_quantity_shipped: '1000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515811',
    custrecord_quantity_shipped: '220',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515812',
    custrecord_quantity_shipped: '2984',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515813',
    custrecord_quantity_shipped: '956',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515814',
    custrecord_quantity_shipped: '4000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515815',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515816',
    custrecord_quantity_shipped: '1000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515817',
    custrecord_quantity_shipped: '200',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515818',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515819',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515820',
    custrecord_quantity_shipped: '1000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515821',
    custrecord_quantity_shipped: '1000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515822',
    custrecord_quantity_shipped: '110',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515823',
    custrecord_quantity_shipped: '200',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515824',
    custrecord_quantity_shipped: '148',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515825',
    custrecord_quantity_shipped: '494',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515826',
    custrecord_quantity_shipped: '5',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515827',
    custrecord_quantity_shipped: '500',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515828',
    custrecord_quantity_shipped: '118',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515829',
    custrecord_quantity_shipped: '3000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515830',
    custrecord_quantity_shipped: '354',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515831',
    custrecord_quantity_shipped: '100',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515832',
    custrecord_quantity_shipped: '800',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515833',
    custrecord_quantity_shipped: '400',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515834',
    custrecord_quantity_shipped: '500',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515835',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515836',
    custrecord_quantity_shipped: '200',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515837',
    custrecord_quantity_shipped: '268',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '33570',
    custrecord_p_custcol_plan_number: 'ORDXM515838',
    custrecord_quantity_shipped: '600',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '21555',
    custrecord_p_custcol_plan_number: 'XM38541',
    custrecord_quantity_shipped: '700',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM2676142',
    custrecord_quantity_shipped: '1650',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267643',
    custrecord_quantity_shipped: '17911',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267644',
    custrecord_quantity_shipped: '66952',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267642',
    custrecord_quantity_shipped: '16093',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267630',
    custrecord_quantity_shipped: '889',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19025',
    custrecord_p_custcol_plan_number: 'XM267625',
    custrecord_quantity_shipped: '11879',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19033',
    custrecord_p_custcol_plan_number: 'XM268484',
    custrecord_quantity_shipped: '71',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19033',
    custrecord_p_custcol_plan_number: 'XM268485',
    custrecord_quantity_shipped: '71',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19033',
    custrecord_p_custcol_plan_number: 'XM268486',
    custrecord_quantity_shipped: '71',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '19033',
    custrecord_p_custcol_plan_number: 'XM268487',
    custrecord_quantity_shipped: '71',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18738',
    custrecord_p_custcol_plan_number: 'XM2589173',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '19031',
    custrecord_p_custcol_plan_number: 'XM2682146',
    custrecord_quantity_shipped: '880',
    custrecord_salesorder_shipped: 'F'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260071',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260041',
    custrecord_quantity_shipped: '12000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260050',
    custrecord_quantity_shipped: '9054',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260064',
    custrecord_quantity_shipped: '9421',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260038',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260034',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260069',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260062',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260066',
    custrecord_quantity_shipped: '12000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260067',
    custrecord_quantity_shipped: '21000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260029',
    custrecord_quantity_shipped: '30000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260057',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260048',
    custrecord_quantity_shipped: '7500',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260051',
    custrecord_quantity_shipped: '9000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260049',
    custrecord_quantity_shipped: '19394',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260030',
    custrecord_quantity_shipped: '10000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260023',
    custrecord_quantity_shipped: '50000',
    custrecord_salesorder_shipped: 'T'
},
{
    custrecord_p_custcol_salesorder: '18749',
    custrecord_p_custcol_plan_number: 'XM260024',
    custrecord_quantity_shipped: '20000',
    custrecord_salesorder_shipped: 'T'
}]
    function execute(context) {
        items.map(function(item) {
            search.create({
                type: 'customrecord_shipping_plan',
                filters: [['custrecord_p_custcol_salesorder', 'anyof', [item.custrecord_p_custcol_salesorder]], 'AND', ['custrecord_p_custcol_plan_number', 'is', item.custrecord_p_custcol_plan_number]]
            }).run().each(function(res) {
                log.error(res.id); record.submitFields({
                    type: 'customrecord_shipping_plan',
                    id: res.id,
                    values: {
                        custrecord_quantity_shipped: item.custrecord_quantity_shipped,
                        custrecord_salesorder_shipped: item.custrecord_salesorder_shipped
                    }
                })
            })
        })
    }

    return {
        execute: execute
    }
});