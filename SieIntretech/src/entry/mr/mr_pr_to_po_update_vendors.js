/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 *@author Charles Zhang
 *@description 定时更新CUX-PR的最低和最近价格供应商
 */
define([
    'N/record',
    'N/search',
    '../../app/app_get_purchase_price',
], (
    recordMod,
    searchMod,
    appGetPurPrice,
) => {

    const cuxPrRecType = 'customrecord_purchase_application';
    const itemFieldId = 'custrecord_item_num_pr';
    const subsidiaryFieldId = 'custrecord_platform_pr_subsidiary';
    const vendorFieldId = 'custrecord_plan_vendor_pr';
    const lastestVendorFieldId = 'custrecord_platform_reference_vender';
    const remainQtyFieldId = 'custrecord_platform_pr_not_order_number';
    const currencyFieldId = 'custrecord_platform_pr_currency';
    const isLevelPriceFieldId = 'custrecord_step_price_pr';
    const pendingApproveStatus = '1';
    const approvedStatus = '2';
    const closedStatus = '6';
    const submitApprovalStatus = '7';
    const noneOption = '@NONE@';
    const successFlag = 'success';
    const failFlag = 'fail';

    //entry points
    function getInputData(context) {
        const filters = [
            ['isinactive', 'is', 'F'],
            'AND',
            ['custrecord_status_plan_pr', 'anyof', [approvedStatus, submitApprovalStatus, pendingApproveStatus, closedStatus]],
            'AND',
            ['custrecord_platform_pr_not_order_number', 'greaterthan', 0],//剩余可推数量大于0
            'AND',
            [itemFieldId, 'noneof', [noneOption]],
            'AND',
            [subsidiaryFieldId, 'noneof', [noneOption]],
        ];
        const columns = [
            subsidiaryFieldId,
            itemFieldId,
            vendorFieldId,
            lastestVendorFieldId,
            remainQtyFieldId,
            currencyFieldId,
            isLevelPriceFieldId,
        ];

        const searchObj = searchMod.create({
            type: cuxPrRecType,
            filters: filters,
            columns: columns,
        });

        return searchObj;
    }

    function map(context) {
        let statusFlag = 'NONE';
        const { key: prId, value } = context;
        let {
            values: {
                [subsidiaryFieldId]: { value: subsidiary },
                [itemFieldId]: { value: itemId },
                [currencyFieldId]: { value: currency = '' },
                [remainQtyFieldId]: itemQty,
                [vendorFieldId]: { value: currentLowestVendor = '' },
                [lastestVendorFieldId]: { value: currentLatestVendor = '' },
                [isLevelPriceFieldId]: currentIsLevelPrice,
            }
        } = JSON.parse(value);

        const { status, results: priceInfo } = appGetPurPrice.getOutPurchPrice({
            itemInfo: { [itemId]: +itemQty || 0 },
            subsidiary,
            currency,
            reqLatest: true,
        });

        if (status === 'success') {
            const { [itemId]: curItemPrice } = priceInfo;
            if (curItemPrice) {
                let lowestPriceVendor = '';
                let lastestPriceVendor = '';
                let isLevelPrice = false;
                const { lowest, latest } = curItemPrice;
                if (lowest) {
                    ({ vendorId: lowestPriceVendor, isLevelPrice } = lowest);
                }
                if (latest) {
                    ({ vendorId: lastestPriceVendor } = latest);
                }

                //转换为统一的格式，以便于比较
                if (isLevelPrice === true) {
                    isLevelPrice = 'T';
                } else if (isLevelPrice === false) {
                    isLevelPrice = 'F';
                }

                if (currentIsLevelPrice === true) {
                    currentIsLevelPrice = 'T';
                } else if (currentIsLevelPrice === false) {
                    currentIsLevelPrice = 'F';
                }

                if (currentLowestVendor != lowestPriceVendor || currentLatestVendor != lastestPriceVendor || currentIsLevelPrice !== isLevelPrice) {
                    recordMod.submitFields({
                        type: cuxPrRecType,
                        id: prId,
                        values: {
                            [vendorFieldId]: lowestPriceVendor,
                            [lastestVendorFieldId]: lastestPriceVendor,
                            [isLevelPriceFieldId]: isLevelPrice,
                        }
                    });
                    statusFlag = successFlag;
                }
            }
        } else {
            statusFlag = failFlag;
        }

        context.write({
            key: prId,
            value: statusFlag
        });
    }

    function summarize(summary) {
        const { mapSummary, output } = summary;

        //记录系统级错误
        mapSummary.errors.iterator().each((key, error, executionNo) => {
            log.error({
                title: `第${executionNo}次更新CUX-PR ${key} 的最新供应商时出错`,
                details: error
            });
            return true;
        });

        //遍历结果
        const failedList = new Set();
        const successList = new Set();
        output.iterator().each((prId, statusFlag) => {
            if (statusFlag === failFlag) {
                failedList.add(prId);
            } else if (statusFlag === successFlag) {
                successList.add(prId);
            }
            return true;
        });

        //记录结果
        if (successList.size) {
            log.debug({
                title: '以下CUX-PR更新最近价格供应商成功',
                details: [...successList]
            });
        }
        if (failedList.size) {
            log.error({
                title: '以下CUX-PR查询最近价格供应商失败',
                details: [...failedList]
            });
        }
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    }
});