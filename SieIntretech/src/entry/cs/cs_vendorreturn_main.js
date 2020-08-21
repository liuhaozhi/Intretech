/**
 * @NApiVersion 2.0
 * @NScriptType ClientScript
 */
define(['N/currentRecord', 'N/ui/dialog', 'N/search'], function (currentRecordMod, dialog, search) {

	var pageMode, currentRecord;

	function getMapKey(itemId, lineId) {
		return itemId + '-' + lineId;
	}

	function getItemCache(context) {
		var pageRec,
			lineCount,
			itemId,
			lineId,
			itemQty,
			_self = getItemCache,
			i;

		if (!_self.cache) {
			pageRec = context.currentRecord;
			_self.cache = {};
			lineCount = pageRec.getLineCount({
				sublistId: 'item'
			});

			for (i = 0; i < lineCount; i++) {
				itemId = pageRec.getSublistValue({
					sublistId: 'item',
					fieldId: 'item',
					line: i
				});
				lineId = pageRec.getSublistValue({
					sublistId: 'item',
					fieldId: 'line',
					line: i
				});
				itemQty = pageRec.getSublistValue({
					sublistId: 'item',
					fieldId: 'quantity',
					line: i
				});

				_self.cache[getMapKey(itemId, lineId)] = {
					qty: itemQty
				};
			}
		}

		return _self.cache;
	}

	function getReturnedQty(context) {
		var pageRec = context.currentRecord,
			_self = getReturnedQty,
			createdFrom = pageRec.getValue({
				fieldId: 'createdfrom'
			}),
			vraId = pageRec.id,
			returnAvailQty = {},
			filters,
			columns;

		if (!_self.hasOwnProperty('returnAvailQty')) {
			try {
				filters = [
					['mainline', 'is', 'F'],
					'AND',
					['taxline', 'is', 'F'],
					'AND',
					['internalid', 'is', createdFrom]
				];
				columns = [
					{
						name: 'item',
						summary: search.Summary.GROUP
					},
					{
						name: 'line',
						summary: search.Summary.GROUP
					},
					{
						name: 'quantityuom',
						summary: search.Summary.MAX
					}
				];
				if (vraId) {
					columns.push({
						name: 'formulanumeric',
						formula: "CASE WHEN {applyingtransaction.recordtype}='vendorreturnauthorization' AND {applyingtransaction.ID} <> " + vraId + " THEN ABS({applyingtransaction.quantityuom}) ELSE 0 END",
						summary: search.Summary.SUM
					});
				} else {
					columns.push({
						name: 'formulanumeric',
						formula: "CASE WHEN {applyingtransaction.recordtype}='vendorreturnauthorization' THEN ABS({applyingtransaction.quantityuom}) ELSE 0 END",
						summary: search.Summary.SUM
					});
				}

				search.create.promise({
					type: 'purchaseorder',
					filters: filters,
					columns: columns
				}).then(function (searchObj) {
					searchObj.run().each(function (result) {
						var resultColumns = result.columns,
							itemId = result.getValue(resultColumns[0]) + '',
							lineId = result.getValue(resultColumns[1]) + '',
							orderQty = +result.getValue(resultColumns[2]) || 0,
							returnedQty = +result.getValue(resultColumns[3]) || 0;

						returnAvailQty[getMapKey(itemId, lineId)] = {
							availQty: +(orderQty - returnedQty).toFixed(6),
							orderQty: orderQty,
							returnedQty: returnedQty
						};
						return true;
					});
				});

				_self.returnAvailQty = returnAvailQty;
			} catch (ex) {
				_self.returnAvailQty = null;
				console.error('查询可退数量失败', ex);
			}
		}

		// console.log('returnAvailQty', _self.returnAvailQty);

		return _self.returnAvailQty;
	}

	function validateReturnQty(context) {
		var pageRec = context.currentRecord,
			lineCount = pageRec.getLineCount({
				sublistId: 'item'
			}),
			itemId,
			lineId,
			itemQty,
			itemName,
			itemAvailQty,
			returnAvailQty = getReturnedQty(context),
			i;

		//编辑状态不验证,因为行上没有直接的信息可以和po行关联
		if (pageMode == 'edit') {
			return true;
		}

		if (!returnAvailQty) {
			dialog.alert({
				title: '错误',
				message: '查询可退数量失败，可能是网络链接失败所致，请您刷新页面后重试。'
			});
			return false;
		}

		//验证可退数量
		for (i = 0; i < lineCount; i++) {
			itemId = pageRec.getSublistValue({
				sublistId: 'item',
				fieldId: 'item',
				line: i
			});
			lineId = pageRec.getSublistValue({
				sublistId: 'item',
				fieldId: 'line',
				line: i
			});
			itemQty = pageRec.getSublistValue({
				sublistId: 'item',
				fieldId: 'quantity',
				line: i
			});
			itemAvailQty = returnAvailQty[getMapKey(itemId, lineId)];
			itemAvailQty = itemAvailQty ? itemAvailQty.availQty : 0;
			if (itemQty > itemAvailQty) {
				itemName = pageRec.getSublistText({
					sublistId: 'item',
					fieldId: 'item',
					line: i
				});
				dialog.alert({
					title: '错误',
					message: '第' + (i + 1) + '行物料(' + itemName + ')的退货数量大于可退数量 ' + itemAvailQty
				});
				return false;
			}
		}

		return true;
	}

	function removeLines(lines) {
		var currentRecord = currentRecordMod.get();
		var lineCount = currentRecord.getLineCount({
			sublistId: 'item'
		});
		var lastIndex = lineCount;
		do {
			var line = lines.pop();
			for (var i = lastIndex - 1; i >= 0; i--) {
				var itemId = currentRecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'item',
					line: i
				});
				var lineId = currentRecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'line',
					line: i
				}) || 'null';
				if (itemId == line.itemId && lineId == line.lineId) {
					currentRecord.removeLine({
						sublistId: 'item',
						line: i,
						ignoreRecalc: lines.length ? true : false
					});
					lastIndex = i;
					break;
				}
			}
		} while (lines.length);
	}

	function addRemoveLines(context) {
		var currentRecord = context.currentRecord;
		var $ = jQuery;
		//插入按钮
		var multiRemoveBtn = '<td><table id="tbl_removemultipleitem" cellpadding="0" cellspacing="0" border="0" class="uir-button" style="margin-right:6px;cursor:hand"><tbody><tr id="tr_removemultipleitem" class="tabBnt"><td id="tdleftcap_removemultipleitem"><img src="/images/nav/ns_x.gif" class="bntLT" border="0" height="50%" width="10" alt=""> <img src="/images/nav/ns_x.gif" class="bntLB" border="0" height="50%" width="10" alt=""></td><td id="tdbody_removemultipleitem" height="20" valign="top" nowrap class="bntBgB"><input type="button" class="rndbuttoninpt bntBgT" value="批量删除" id="removemultipleitem"></td><td id="tdrightcap_removemultipleitem"><img src="/images/nav/ns_x.gif" height="50%" class="bntRT" border="0" width="10" alt=""> <img src="/images/nav/ns_x.gif" height="50%" class="bntRB" border="0" width="10" alt=""></td></tr></tbody></table></td>';
		$('#item_form > table.uir-listheader-button-table tr.uir-listheader-button-row').eq(0).prepend(multiRemoveBtn);

		//绑定事件
		$('#removemultipleitem').on('click', function () {
			var html = '<html><head><title>选择批量删除的行</title></head><body>';
			html += '<div style="text-align:center;margin-bottom:20px;"><button type="button" id="removeTop">删除勾选的行</button></div><table border="1" cellpadding="5" style="margin:0px auto;border-collapse:collapse;font-size:14px;text-align:center;">';
			html += '<tr><th>全选<br/><input type="checkbox" id="markall" /></th><th>行号</th><th>货品</th><th>数量</th><th>单价</th><th>金额</th></tr>';

			var lineCount = currentRecord.getLineCount({
				sublistId: 'item'
			});
			for (var i = 0; i < lineCount; i++) {
				var itemId = currentRecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'item',
					line: i
				});
				var itemText = currentRecord.getSublistText({
					sublistId: 'item',
					fieldId: 'item',
					line: i
				});
				var lineId = currentRecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'line',
					line: i
				});
				var itemQty = currentRecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'quantity',
					line: i
				});
				var itemRate = currentRecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'rate',
					line: i
				});
				var itemAmt = currentRecord.getSublistValue({
					sublistId: 'item',
					fieldId: 'amount',
					line: i
				});

				html += '<tr>';
				html += '<td><input type="checkbox" class="select" data-itemid="' + itemId + '" data-lineid="' + (lineId || 'null') + '"></td>';
				html += '<td>' + (i + 1) + '</td>';
				html += '<td>' + itemText + '</td>';
				html += '<td>' + itemQty + '</td>';
				html += '<td>' + itemRate + '</td>';
				html += '<td>' + itemAmt + '</td>';
				html += '</tr>';
			}

			html += '</table><div style="text-align:center;margin-top:20px;"><button type="button" id="removeBottom">删除勾选的行</button></div></body></html>';

			var iWidth = 1000, iHeight = 700;
			var iTop = (window.screen.availHeight - 30 - iHeight) / 2;
			var iLeft = (window.screen.availWidth - 10 - iWidth) / 2;
			var winProp = 'width=' + iWidth + ', height=' + iHeight + ', top=' + iTop + ', left=' + iLeft;
			var popWin = window.open('', '_blank', winProp);
			var popDocument = popWin.document;
			popDocument.write(html);

			var markAll = true;
			//全选/全取消
			popDocument.getElementById('markall').onclick = function (e) {
				var selectInputs = popDocument.getElementsByClassName('select');
				var lines = selectInputs.length;
				for (var i = 0; i < lines; i++) {
					var selectInput = selectInputs[i];
					selectInput.checked = markAll;
				}

				markAll = !markAll;
			}

			//获取要删除的数据
			var rovFuc = function (e) {
				var selectInputs = popDocument.getElementsByClassName('select');
				var lines = selectInputs.length;
				var checkedLines = [];
				for (var i = 0; i < lines; i++) {
					var selectInput = selectInputs[i];
					if (selectInput.checked) {
						var itemId = selectInput.getAttribute('data-itemid');
						var lineId = selectInput.getAttribute('data-lineid');
						checkedLines.push({
							itemId: itemId,
							lineId: lineId
						});
					}
				}

				//console.log('checkedLines', checkedLines.concat());

				if (checkedLines.length) {
					setTimeout(function () {
						removeLines(checkedLines);
					}, 200);
				} else {
					console.log('No selected line');
				}
				popWin.close();
			}
			popDocument.getElementById('removeTop').onclick = rovFuc;
			popDocument.getElementById('removeBottom').onclick = rovFuc;
		});
	}

	function checkIsPoReturn() {
		var pageRec = currentRecordMod.get(),
			createdFrom = pageRec.getValue({
				fieldId: 'createdfrom'
			}),
			_self = checkIsPoReturn,
			createdFromInfo;

		if (!_self.hasOwnProperty('result')) {
			if (createdFrom) {
				try {
					createdFromInfo = search.lookupFields({
						type: 'transaction',
						id: createdFrom,
						columns: ['recordtype']
					});
					if (createdFromInfo['recordtype'] == 'purchaseorder') {
						_self.result = true;
					}
				} catch (ex) {
					_self.result = false;
					console.log('search created from error', ex);
				}
			} else {
				_self.result = false;
			}
		}

		// console.log('checkIsPoReturn', _self.result);

		return _self.result;
	}

	//entry poinits
	function pageInit(scriptContext) {
		currentRecord = scriptContext.currentRecord;
		pageMode = scriptContext.mode;

		if (checkIsPoReturn()) {//过滤普通无单退货
			//查询已退数量，计算可退数量
			getReturnedQty(scriptContext);

			//插入批量删除功能
			addRemoveLines(scriptContext);

			//缓存对应的行信息
			getItemCache(scriptContext);
		}
	}

	function validateLine(scriptContext) {
		var pageRec = scriptContext.currentRecord,
			lineId;

		if (checkIsPoReturn()) {
			if (scriptContext.sublistId == 'item') {
				lineId = pageRec.getCurrentSublistValue({
					sublistId: 'item',
					fieldId: 'line'
				});
				if (!lineId) {//不允许添加非订单行
					dialog.alert({
						title: '提示',
						message: '不能添加非订单行'
					});
					return false;
				}
			}
		}

		return true;
	}

	function validateField(context) {
		var pageRec = context.currentRecord,
			itemId,
			itemQty,
			lineId,
			originalQty,
			itemCache;

		if (checkIsPoReturn()) {
			if (context.sublistId === 'item' && context.fieldId === 'quantity') {
				if (pageMode == 'edit') {
					itemCache = getItemCache(context);
					itemId = pageRec.getCurrentSublistValue({
						sublistId: context.sublistId,
						fieldId: 'item'
					});
					itemQty = pageRec.getCurrentSublistValue({
						sublistId: context.sublistId,
						fieldId: context.fieldId
					});
					lineId = pageRec.getCurrentSublistValue({
						sublistId: context.sublistId,
						fieldId: 'line'
					});
					if (itemId && lineId) {
						originalQty = itemCache[getMapKey(itemId, lineId)].qty;
						if (itemQty > originalQty) {
							alert('已生成的退货授权不能调增物料数量');
							return false;
						}
					}
				}
			}
		}

		return true;
	}

	function saveRecord(scriptContext) {
		//验证可退数量
		if (checkIsPoReturn()) {
			if (!validateReturnQty(scriptContext)) {
				return false;
			}
		}

		return true;
	}

	return {
		pageInit: pageInit,
		validateLine: validateLine,
		// fieldChanged: fieldChanged,
		// postSourcing: postSourcing,
		// sublistChanged: sublistChanged,
		// lineInit: lineInit,
		validateField: validateField,
		// validateInsert: validateInsert,
		// validateDelete: validateDelete,
		saveRecord: saveRecord
	};
});