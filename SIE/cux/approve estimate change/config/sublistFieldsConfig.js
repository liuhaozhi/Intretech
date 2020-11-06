/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([],
    () => {
        const displayType = name => {
            switch(name){
                case 'check':
                    return 'ENTRY'
                case 'role':
                case 'nexts':
                case 'internalid':
                    return 'HIDDEN'
                default :
                    return 'INLINE'
            }
        }

        return {
            sublistFields : (params , searchObj) => {
                return  params.concat(searchObj.columns).map(item => {
                    let type = item.name === 'check' ? 'checkbox' : 'text'
                    
                    return {
                        id : item.join ? (item.join + item.name).toLowerCase() : item.name.toLowerCase(),
                        label : item.label,
                        type : type,
                        displayType : displayType(item.name)
                    } 
                })
            }
        }
    }    
)