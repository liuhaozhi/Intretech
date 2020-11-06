/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([],
    () => {
        const itemSource = name => {
            switch (name) {
                case 'account':
                    return 'account'
                default : return ''
            }
        }

        const itemDisplatType = name => {
            switch(name){
                case 'check' :
                case 'account' : return 'ENTRY'
                case 'transid' :
                case 'transidtext' : return 'HIDDEN'
                default : return 'INLINE'
            }
        }

        const itemType = (type , name) => {
            if(name === 'account') return 'select' 

            let newType = type === 'checkbox' ? 'checkbox' : 'text'

            return newType
        }

        return {
            sublistFields :  (params , searchObj ) => {
                return  params.concat(searchObj.columns).map(item => {
                    let type = JSON.parse(JSON.stringify(item)).type
           
                    return {
                        id : item.join ? (item.join + item.name).toLowerCase() : item.name.toLowerCase(),
                        label : item.label,
                        type : itemType(type , item.name),
                        source : itemSource(item.name),
                        displayType : itemDisplatType(item.name)
                    }
                })
            }
        }
    }    
)