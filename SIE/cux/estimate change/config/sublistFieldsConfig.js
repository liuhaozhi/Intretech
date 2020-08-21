/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([],
    () => {
        const itemSource = name => {
            let source 

            switch(name)
            {
                case 'custbody_cust_ordertype':
                    source = 'customlist_cust_ordertype'
                    break;
                case 'entity':
                    source = 'customer'
                    break;
                case 'department':
                    source = 'department'
                    break;
                case 'custbody_pc_sales_methods':
                    source = 'customlist_sales_method'
                    break;
                case 'custbody_sales_model':
                    source = 'customlist_sales_model_list'
                    break;
                case 'custbody_pc_salesman':
                    source = 'employee'
                    break;
                case 'custbody_wip_documentmaker':
                    source = 'employee'
                    break;
                case 'custbody_om_export_or_not':
                    source = 'customlist_whether_list'
                    break;
                case 'custcol_salesorder':
                    source = 'transaction'
                    break;
                case 'item':
                    source = 'item'
                    break;
                case 'unitabbreviation':
                    source = 'unitstype'
                    break;
                case 'taxcode':
                    source = 'salestaxitem'
                    break;
                case 'custcol_whether_bonded':
                    source = 'customlist_if_under_bond'
                    break;
                case 'custbody_order_status':
                    source = 'customlist_sales_order_status_list'
                    break;
                case 'custcol_effective_mode':
                    source = 'customlist_selling_price_eff_mod_list'
                    break;
                default:
                    break
            }

            return source
        }

        const itemDisplatType = (name , changeType)=> {
            let displayType = 'ENTRY'

            switch(name)
            {
                case 'ordid':
                case 'custcol_plan_number':
                    displayType = 'HIDDEN'
                    break;
                case 'companyname':
                case 'custbody_cust_ordertype':
                case 'customlist_cust_ordertype':
                case 'custbody_order_status':
                case 'customer':
                case 'tranid':
                case 'custcol_salesorder':
                case 'custcol_suggest_date':
                case 'taxcode_display':
                case 'custcol_om_total_discount':
                case 'rate':
                case 'custcol_unit_tax':
                case 'custcol_before_tax':
                case 'aount':
                case 'taxcode_display':
                    displayType = 'INLINE'
                    break;
                default:
                    break
            }

            return displayType 
        }

        return {
            sublistFields :  (params , searchObj , changeType) => {
                return  params.concat(searchObj.columns).map(item => {
                    let type = JSON.parse(JSON.stringify(item)).type
           
                    return {
                        id : item.join ? (item.join + item.name).toLowerCase() : item.name.toLowerCase(),
                        label : item.label,
                        type : type ? type === 'currency2' ? 'currency' : type : 'text',
                        source : itemSource(item.name),
                        displayType : itemDisplatType(item.name,changeType)
                    }
                })
            }
        }
    }    
)