/**
 *@NApiVersion 2.0
 *@NScriptType ClientScript
 *@author Charles Zhang
 *@description 采购订单平台对应的客户端脚本
 */
define([
    'N/currentRecord',
    'N/ui/dialog',
    'N/format',
    'N/https',
], function (
    currentRecord,
    dialog,
    format,
    https
) {

    var pageIndexFieldId = 'custpage_pageindexid',
        pageSizeFieldId = 'custpage_pagesizeid',
        sortFieldId = 'custpage_sort_field',
        sortOrderFieldId = 'custpage_sort_order',
        $platformSublist,
        $platformFreezeSelector,
        $platformContainer,
        syncStep = 50,
        sublistLineCount,
        lastSyncIndex = 0,
        jihuazhongStatus = '1',
        approvedStatus = '2',
        $;

    function getCache(key) {
        var _self = getCache;
        if (!_self.cache) {
            var pageRec = currentRecord.get();
            var pageCache = pageRec.getValue({
                fieldId: 'custpage_pagecache'
            });
            _self.cache = JSON.parse(pageCache);
        }

        return _self.cache[key];
    }

    function appendParamsToURL(baseUrl, params) {
        return Reflect.ownKeys(params).reduce(function (updatedURL, currentParam) {
            return updatedURL + (updatedURL.includes('?') ? '&' : '?') + currentParam + '=' + encodeURIComponent(params[currentParam]);
        }, baseUrl);
    }

    function refreshPage(params) {
        var refreshURL = getCache('refreshURL');
        refreshURL = appendParamsToURL(refreshURL, params);
        localStorage.pltoprplatformfilters = location.origin + refreshURL;
        //防止系统弹窗记录已更改
        setWindowChanged(window, false);
        window.location.assign(refreshURL);
    }

    function goToPage(pageIndex) {
        var refreshParams = getCache('refreshParams');
        refreshParams[pageIndexFieldId] = pageIndex;
        refreshPage(refreshParams);
        return (function () { });//为了不让页面报错
    }

    function searchResults() {
        var searchFields = getDropdown(document.querySelector("input[name='inpt_fieldid_fields_custpage_']")).valueArray,
            pageRec = currentRecord.get(),
            pageSize = pageRec.getValue({
                fieldId: pageSizeFieldId
            }),
            sortField = pageRec.getValue({
                fieldId: sortFieldId
            }),
            sortOrder = pageRec.getValue({
                fieldId: sortOrderFieldId
            }),
            urlParams = {};

            if (pageSize > 1000 || pageSize < 0) {
                dialog.alert({
                    title: '错误',
                    message: '每页显示数量必须在1000条以内'
                });
                return false;
            }

        //页码
        urlParams[pageIndexFieldId] = 0;
        urlParams[pageSizeFieldId] = pageSize;

        //设置排序
        if (sortField && sortOrder) {
            urlParams[sortFieldId] = sortField;
            urlParams[sortOrderFieldId] = sortOrder;
        }

        //搜索字段取值
        var filtersExp = [],
            transformValue = function(value) {
                if (value instanceof Date) {
                    value = format.format({
                        value: value,
                        type: format.Type.DATE
                    });
                } else if (value === false) {
                    value = "F";
                } else if (value === true) {
                    value = "T";
                } else if (typeof value === 'string') {
                    value = value.trim();
                } else if (typeof value === 'number') {
                    value = value + "";
                }
                return value;
            };
        searchFields.forEach(function (fieldId) {
            var trNode = findFieldUIContainer(fieldId);
            if(trNode.style.display == "none" || !fieldId) { return true; }
            var op = pageRec.getValue("operator_fields_custpage_" + fieldId),
                values = [transformValue(pageRec.getValue("values_fields_custpage_" + fieldId))];
            if(/within/.test(op)) {
                values = [transformValue(pageRec.getValue("operator_fields_left_custpage_" + fieldId)), transformValue(pageRec.getValue("operator_fields_right_custpage_" + fieldId))];
            } else if(/between/.test(op)) {
                values = [transformValue(pageRec.getValue("operator_fields_min_custpage_" + fieldId)), transformValue(pageRec.getValue("operator_fields_max_custpage_" + fieldId))];
            }
            if(!(values + '') || values[0] == '' || values[1] == '') { return true; }
            if(filtersExp.length) {
                filtersExp.push("AND");
            }
            filtersExp.push([fieldId, op, values]);
        });
        
        refreshPage({ filters: JSON.stringify(filtersExp) });
        return true;
    }

    function setSortValues(sortField, sortOrder) {
        var pageRec = currentRecord.get();
        pageRec.setValue({
            fieldId: sortFieldId,
            value: sortField
        });
        pageRec.setValue({
            fieldId: sortOrderFieldId,
            value: sortOrder
        });
    }

    function getCenterPopWinProp(popWidth, popHeight) {
        var win = window,
            iWidth = popWidth || 700,
            iHeight = popHeight || 400,
            iTop = (win.screen.availHeight - 30 - iHeight) / 2,
            iLeft = (win.screen.availWidth - 10 - iWidth) / 2,
            winProp = 'width=' + iWidth + ', height=' + iHeight + ', top=' + iTop + ', left=' + iLeft;

        return {
            top: iTop,
            left: iLeft,
            winProp: winProp
        }
    }

    function setCustomPreference() {
        var setPrefUrl = getCache('setPrefUrl'),
            popupProp = getCenterPopWinProp(800, 600);
        window.open(setPrefUrl, null, popupProp.winProp);
    }

    function getSelectedEntries() {
        var $ = jQuery,
            selectedCheckbox,
            lineIndexs = [],
            selectLines = [];

        if (!$platformFreezeSelector) {
            $platformFreezeSelector = $('#platformFreezeSelector');
        }

        selectedCheckbox = $platformFreezeSelector.find('input[name^="custpage_sublist_line"]:checked');
        selectedCheckbox.each(function (checkIndex, element) {
            var selectName,
                checkbox = $(element),
                targetLineSelector,
                $curFreezeLine,
                selectLine = {};

            //查找冻结列的值
            $curFreezeLine = checkbox.closest('tr');
            $curFreezeLine.find('input:not([name^="custpage_sublist_line"]), select').each(function (inputIndex, input) {
                var key;
                input = $(input);
                key = input.attr('name');
                key = key ? key.match(/^(\D+)/) : '';
                key = key ? key[0] : '';
                selectLine[key] = input.val();
            });

            //查找列表值
            selectName = checkbox.attr('name');
            targetLineSelector = 'tr.' + selectName;
            $platformSublist.find(targetLineSelector + ' input,' + targetLineSelector + ' select').each(function (inputIndex, input) {
                var key;
                input = $(input);
                key = input.attr('name');
                key = key ? key.match(/^(\D+)/) : '';
                key = key ? key[0] : '';
                selectLine[key] = input.val();
            });

            selectLines.push(selectLine);
            lineIndexs.push($curFreezeLine.index());
        });

        return {
            selectLines: selectLines,
            lineIndexs: lineIndexs
        }
    }

    //同步行高度
    function syncTableLineHeight(sublistCells, freezeCells) {
        var hideClass = 'platformHideElement';
        sublistCells.forEach(function (cell, index) {
            var freezeCell = freezeCells[index],
                currentHeight,
                freezeHeight;

            //先展示行，才能取的实际高度
            cell.parentNode.classList.remove(hideClass);
            freezeCell.parentNode.classList.remove(hideClass);

            currentHeight = cell.clientHeight;
            freezeHeight = freezeCell.clientHeight;
            currentHeight = Math.max(currentHeight, freezeHeight);
            currentHeight = (currentHeight + 1) + 'px';

            cell.height = currentHeight;
            freezeCell.height = currentHeight;
        });
    }

    //切换选择状态
    function toggleSelectLine(eventTarget, $) {
        var seletName = eventTarget.attr('name'),
            selectedClass = 'platformSelectedLine';
        $ = $ || jQuery;
        if (eventTarget.is(':checked')) {
            $platformSublist.find('tr.' + seletName).addClass(selectedClass);
            eventTarget.closest('tr').addClass(selectedClass);
        } else {
            $platformSublist.find('tr.' + seletName).removeClass(selectedClass);
            eventTarget.closest('tr').removeClass(selectedClass);
        }
    }

    function setSinglePieceLines(sublistCells, freezeCells) {
        var currentStep = Math.min(sublistLineCount - lastSyncIndex, syncStep),
            newEndIndex = lastSyncIndex + currentStep;
        syncTableLineHeight(sublistCells.slice(lastSyncIndex, newEndIndex), freezeCells.slice(lastSyncIndex, newEndIndex));
        lastSyncIndex = newEndIndex;
    }

    function setNextPiecesOfLines(sublistCells, freezeCells) {
        if (lastSyncIndex < sublistLineCount) {
            var _self = arguments.callee;
            clearTimeout(_self.timeId);
            _self.timeId = setTimeout(function () {
                setSinglePieceLines(sublistCells, freezeCells);
            }, 1000);
        }
    }

    //行内编辑功能
    function inlineEditConfirm(event) {
        var $eventTarget = $(event.target),
            targetName = $eventTarget.attr('data-target-for'),
            targetFieldId,
            inputField,
            curLineElement,
            curInternalIdElement,
            curInternalId,
            curInternalIdIndex,
            curTableElement,
            theOtherTableElement,
            updateBody,
            inputVal;

        if (targetName) {
            inputField = $eventTarget.prev('[name="' + targetName + '"]');
            if (inputField.length) {
                inputVal = inputField.val();
                curLineElement = inputField.closest('tr');

                //先查找列表值
                curInternalIdElement = curLineElement.find('input[name^="custpage_internalid"');
                if (curInternalIdElement.length) {
                    curInternalId = curInternalIdElement.val();
                } else {
                    //如果查找不到，从另外一个表格查找计划单ID
                    curInternalIdIndex = targetName.match(/\d+/g);
                    if (curInternalIdIndex) {
                        curInternalIdIndex = curInternalIdIndex.pop();
                        curTableElement = curLineElement.closest('table');
                        if (curTableElement.attr('id') === 'platformSublist') {
                            theOtherTableElement = $platformFreezeSelector;
                        } else {
                            theOtherTableElement = $platformSublist;
                        }
                        curInternalId = theOtherTableElement.find('input[name="custpage_internalid' + curInternalIdIndex + '"').val();
                    }
                }

                // console.log('curInternalId', curInternalId);

                if (!curInternalId) {
                    dialog.alert({
                        title: '提示',
                        message: '没有找到该字段对应的计划单ID'
                    });
                    return false;
                }

                targetFieldId = targetName.match(/^(\D+)/);
                targetFieldId = targetFieldId ? targetFieldId[0] : '';
                updateBody = {
                    custpage_internalid: curInternalId,
                };
                updateBody[targetFieldId] = inputVal;

                //更新字段值
                https.post.promise({
                    url: getCache('inlineEditUrl') + '&islinlineedit=T',
                    body: {
                        updateLines: JSON.stringify([updateBody])
                    }
                }).then(function (rsp) {
                    // console.log('rsp.body', rsp.body);
                    var rspBody = JSON.parse(rsp.body);
                    rspBody = rspBody[0];
                    if (rspBody.status === 'success') {
                        dialog.alert({
                            title: '提示',
                            message: '更新成功'
                        });
                    } else {
                        Promise.reject(rspBody.message);
                    }
                }).catch(function (reason) {
                    dialog.alert({
                        title: '错误',
                        message: '行内更新失败, 错误提示: ' + reason
                    });
                });
            }
        }
        // event.stopPropagation();
    }

    //初始化页面布局
    function initSublistTable() {
        var doc = document,
            win = window,
            body = doc.body,
            leftTopContainer = doc.querySelector('#platformLeftTopContainer'),
            leftBottomContainer = doc.querySelector('#platformLeftBottomContainer'),
            rightTopContainer = doc.querySelector('#platformRightTopContainer'),
            sublistContainer = doc.querySelector('#platformRightBottomContainer'),
            platformSublist = sublistContainer.querySelector('#platformSublist'),
            headerLine = platformSublist.querySelector('tr:first-child'),
            freezeCells = leftBottomContainer.querySelectorAll('td:first-child'),
            sublistCells = platformSublist.querySelectorAll('td:first-child'),
            selectAllButton = leftTopContainer.querySelector('#custpage_select_all'),
            columnFreezeCount = +getCache('columnFreezeCount'),
            singColumnWidth = +getCache('singColumnWidth'),
            header = doc.querySelector('#div__header'),
            buttonArea = doc.querySelector('.uir-header-buttons'),
            filterTable = doc.querySelector('.uir-outside-fields-table'),
            headerHeight = header ? header.clientHeight : 0,
            buttonHeight = buttonArea ? buttonArea.clientHeight : 0,
            filterHeight = filterTable ? filterTable.clientHeight : 0,
            formTitleHeight = 35,
            heightOffset = 80,
            winWidth = body.clientWidth || 1366,
            // winHeight = body.clientHeight || 768,
            winHeight = win.innerHeight || 768,
            freeContainerWidth = 100 + singColumnWidth * columnFreezeCount,
            containerWidth = (winWidth - freeContainerWidth - 20) + 'px',
            containerHeight = (winHeight - headerHeight - formTitleHeight - buttonHeight - filterHeight - heightOffset) + 'px',
            lastScrollTop = 0,
            lastScrollLeft = 0,
            $ = jQuery,
            $leftBottomContainer = $(leftBottomContainer),
            $rightTopContainer = $(rightTopContainer),
            $sublistContainer = $(sublistContainer),
            lastSelectedLine = null;

        //缓存子列表DOM
        $platformSublist = $(platformSublist);
        $platformContainer = $('#platformContainer'),

            //隐藏本来的横条和列
            headerLine.style.display = 'none';

        //设置容器宽度高度
        rightTopContainer.style.width = containerWidth;
        sublistContainer.style.width = containerWidth;
        leftBottomContainer.style.height = containerHeight;
        sublistContainer.style.height = containerHeight;
        leftTopContainer.style.width = freeContainerWidth + 'px';
        leftBottomContainer.style.width = freeContainerWidth + 'px';

        //显示冻结行列
        leftTopContainer.style.display = 'block';
        leftBottomContainer.style.display = 'block';
        rightTopContainer.style.display = 'block';

        //顶部标题行高度同步
        var rightTopLastCell = rightTopContainer.querySelector('th:first-child'),
            leftTopFirstCell = leftTopContainer.querySelector('th:first-child'),
            rightTopContainerHeight = rightTopLastCell.clientHeight,
            leftTopContainerHeight = leftTopFirstCell.clientHeight;
        rightTopContainerHeight = Math.max(rightTopContainerHeight, leftTopContainerHeight);
        rightTopContainerHeight = (rightTopContainerHeight + 1) + 'px';
        leftTopFirstCell.height = rightTopContainerHeight;
        rightTopLastCell.height = rightTopContainerHeight;

        //设置偏移量，以隐藏滚动条
        var topOffset = rightTopContainer.offsetHeight - rightTopContainer.clientHeight;
        var leftOffset = rightTopContainer.offsetWidth - rightTopContainer.clientWidth;
        topOffset = '-' + topOffset + 'px';
        leftOffset = '-' + leftOffset + 'px';
        leftBottomContainer.style.marginTop = topOffset;
        rightTopContainer.style.marginLeft = leftOffset;
        sublistContainer.style.marginTop = topOffset;
        sublistContainer.style.marginLeft = leftOffset;

        //同步行高度-首次同步-分步同步，避免页面响应时间过长
        sublistCells = Array.from(sublistCells);
        freezeCells = Array.from(freezeCells);
        sublistLineCount = sublistCells.length;
        setSinglePieceLines(sublistCells, freezeCells);

        //关联滚动事件
        sublistContainer.addEventListener('scroll', function (event) {
            var _self = $(this),
                currentScrollTop = _self.scrollTop(),
                currentScrollLeft = _self.scrollLeft();

            if (currentScrollTop !== lastScrollTop) {
                $leftBottomContainer.scrollTop(currentScrollTop);
                lastScrollTop = currentScrollTop;
                //同步新条目
                setNextPiecesOfLines(sublistCells, freezeCells);
            } else if (currentScrollLeft !== lastScrollLeft) {
                $rightTopContainer.scrollLeft(currentScrollLeft);
                lastScrollLeft = currentScrollLeft;
            }
        });
        leftBottomContainer.addEventListener('scroll', function (event) {
            var _self = $(this),
                currentScrollTop = _self.scrollTop();

            if (currentScrollTop !== lastScrollTop) {
                $sublistContainer.scrollTop(currentScrollTop);
                lastScrollTop = currentScrollTop;
            }
        });

        //勾选框点击事件
        leftBottomContainer.addEventListener('change', function (event) {
            var eventTarget = $(event.target),
                targetName = 'custpage_sublist_line',
                targetFullName = eventTarget.attr('name');
            if (targetFullName && targetFullName.startsWith(targetName)) {
                win.requestAnimationFrame(function () {
                    toggleSelectLine(eventTarget, $);
                });
            }
            event.stopPropagation();
        });

        //添加Shift多选
        leftBottomContainer.addEventListener('click', function (event) {
            var eventTarget = $(event.target),
                targetName = 'custpage_sublist_line',
                targetFullName = eventTarget.attr('name'),
                curLineIndex;
            if (targetFullName && targetFullName.startsWith(targetName)) {
                curLineIndex = +targetFullName.slice(targetName.length);
                if (event.shiftKey) {
                    if (lastSelectedLine !== null && lastSelectedLine !== curLineIndex) {
                        var startIndex = Math.min(lastSelectedLine, curLineIndex),
                            endIndex = Math.max(lastSelectedLine, curLineIndex),
                            _self = $(this),
                            lineSelector = '',
                            isChecked = eventTarget.is(':checked');

                        for (; startIndex <= endIndex; startIndex++) {
                            if (startIndex == curLineIndex) {
                                continue;
                            }
                            if (isChecked) {
                                lineSelector = 'input[name="' + targetName + startIndex + '"]:not(:checked)';
                            } else {
                                lineSelector = 'input[name="' + targetName + startIndex + '"]:checked';
                            }
                            _self.find(lineSelector).trigger('click');
                        }
                    }
                }
                lastSelectedLine = curLineIndex;
            }
            event.stopPropagation();
        });

        //全选
        selectAllButton.addEventListener('change', function (event) {
            var $selectAllButton = $(event.target),
                lineSelector = '';
            if ($selectAllButton.is(':checked')) {
                lineSelector = 'input[name^="custpage_sublist_line"]:visible:not(:checked)';
            } else {
                lineSelector = 'input[name^="custpage_sublist_line"]:visible:checked';
            }

            $(leftBottomContainer).find(lineSelector).trigger('click');
            event.stopPropagation();
        });

        //排序事件
        $('#platformLeftTopContainer th, #platformRightTopContainer th').on('click', function (event) {
            event.stopPropagation();
            var titleCell = $(this);

            //排除全选按钮
            if (titleCell.find('#custpage_select_all').length) {
                return true;
            }

            //判断是否已有排序
            var columnName = titleCell.text();
            var sortField = titleCell.attr('data-column-name');

            dialog.create({
                title: '提示',
                message: '请选择 ' + columnName + ' 的排序方式',
                buttons: [
                    {
                        label: '顺序',
                        value: 'ASC'
                    },
                    {
                        label: '倒序',
                        value: 'DESC'
                    },
                    {
                        label: '取消',
                        value: ''
                    }
                ]
            }).then(function (sortOrder) {
                if (sortField && sortOrder) {
                    setSortValues(sortField, sortOrder);
                    searchResults();
                }
            }).catch(function (reason) {
                console.log('选择排序方式失败', reason);
            });

            return false;
        });

        //行内编辑事件
        $leftBottomContainer.on('click', inlineEditConfirm);
        $sublistContainer.on('click', inlineEditConfirm);
    }

    //平台操作相关的功能
    function plSeparate() {
        var splitLineUrl = getCache('splitLineUrl'),
            popupProp = getCenterPopWinProp(800, 600),
            selectedInfo = getSelectedEntries(),
            selectLines = selectedInfo.selectLines,
            selectedLength = selectLines.length,
            selectedLine = selectLines[0],
            mrpLineId;

        //验证勾选数量
        if (selectedLength === 0) {
            dialog.alert({
                title: '提示',
                message: '您没有勾选任何条目'
            });
            return false;
        } else if (selectedLength > 1) {
            dialog.alert({
                title: '提示',
                message: '您只能同时分拆一条计划单，而您勾选了多于一条的计划单'
            });
            return false;
        }

        //验证计划单状态
        if (selectedLine['custpage_custrecord_status_plan'] != jihuazhongStatus) {
            dialog.alert({
                title: '提示',
                message: '您勾选的计划单状态不是计划中，不能进行分拆'
            });
            return false;
        }

        mrpLineId = selectedLine['custpage_internalid'];
        window.open(splitLineUrl + '&mrprecid=' + mrpLineId, null, popupProp.winProp);
    }

    function plCombine() {
        var mergeLineUrl = getCache('mergeLineUrl'),
            popupProp = getCenterPopWinProp(800, 600),
            selectedInfo = getSelectedEntries(),
            selectLines = selectedInfo.selectLines,
            selectedLength = selectLines.length,
            lineIndexs = selectedInfo.lineIndexs,
            popWindow,
            currentLine,
            combineItemGroup = {},
            itemId,
            singleGroup,
            submitPageHtml = '';

        if (selectedLength < 2) {
            dialog.alert({
                title: '提示',
                message: '您必须至少选择两条记录才能进行合并'
            });
            return false;
        }

        //验证计划单状态
        for (var i = 0; i < selectedLength; i++) {
            currentLine = selectLines[i];
            if (currentLine['custpage_custrecord_status_plan'] != jihuazhongStatus) {
                dialog.alert({
                    title: '提示',
                    message: '您勾选的第' + (lineIndexs[i] + 1) + '行计划单状态不是计划中，不能进行合并'
                });
                return false;
            }
            itemId = currentLine['custpage_custrecord_item_nums'];
            if (!combineItemGroup[itemId]) {
                combineItemGroup[itemId] = {
                    count: 0,
                    lineIndex: lineIndexs[i],
                    value: itemId,
                }
            }
            combineItemGroup[itemId].count++;
        }

        //验证合并物料信息
        singleGroup = Object.keys(combineItemGroup).find(function (itemId) {
            return combineItemGroup[itemId].count < 2;
        });
        if (singleGroup) {
            var itemNameSelector = 'input[name^="custpage_custrecord_item_nums"][value="' + combineItemGroup[singleGroup].value + '"]';
            var itemName = $platformContainer.find(itemNameSelector).eq(0).parent().text();
            dialog.alert({
                title: '提示',
                message: '您选择的计划行中，有物料 ' + itemName + ' 的合并计划单不足两条，无法合并'
            });
            return false;
        }

        //只过滤需要的信息
        selectLines = selectLines.map(function (line) {
            return {
                'custpage_internalid': line['custpage_internalid'],
            };
        });

        if (!window.confirm('您确定合并所选条目吗?')) {
            return false;
        }

        submitPageHtml += '<!DOCTYPE html><html>'
            + '<head>'
            + '<meta charset="utf-8">'
            + '<title>计划单合并</title>'
            + '</head>'
            + '<body style="display:none;">'
            + '<form action="' + mergeLineUrl + '" method="post" id="mergeMainForm">'
            + '<textarea name="mergeEntries" id="mergeEntries">' + JSON.stringify(selectLines) + '</textarea>'
            + '</form>'
            + '<script>document.getElementById("mergeMainForm").submit();</script>'
            + '</body>'
            + '</html>';

        popWindow = window.open('', null, popupProp.winProp);
        popWindow.document.write(submitPageHtml);
    }

    function plTransform() {
        var transformLineUrl = getCache('transformLineUrl'),
            popupProp = getCenterPopWinProp(800, 600),
            selectedInfo = getSelectedEntries(),
            selectLines = selectedInfo.selectLines,
            selectedLength = selectLines.length,
            lineIndexs = selectedInfo.lineIndexs,
            popWindow,
            submitPageHtml = '';

        if (selectedLength === 0) {
            dialog.alert({
                title: '提示',
                message: '您没有勾选任何条目'
            });
            return false;
        }

        //验证计划单状态
        for (var i = 0; i < selectedLength; i++) {
            if (selectLines[i]['custpage_custrecord_status_plan'] != approvedStatus) {
                dialog.alert({
                    title: '提示',
                    message: '您勾选的第' + (lineIndexs[i] + 1) + '行计划单状态不是已审核，不能进行投放'
                });
                return false;
            }
        }

        //只过滤需要的信息
        selectLines = selectLines.map(function (line) {
            return {
                'custpage_internalid': line['custpage_internalid'],
            };
        });

        if (!window.confirm('您确定要投放所选计划单吗?')) {
            return false;
        }

        submitPageHtml += '<!DOCTYPE html><html>'
            + '<head>'
            + '<meta charset="utf-8">'
            + '<title>计划单投放</title>'
            + '</head>'
            + '<body style="display:none;">'
            + '<form action="' + transformLineUrl + '" method="post" id="transformMainForm">'
            + '<textarea name="transformEntries" id="transformEntries">' + JSON.stringify(selectLines) + '</textarea>'
            + '</form>'
            + '<script>document.getElementById("transformMainForm").submit();</script>'
            + '</body>'
            + '</html>';

        popWindow = window.open('', null, popupProp.winProp);
        popWindow.document.write(submitPageHtml);
    }

    function plMassUpdate() {
        var inlineEditUrl = getCache('inlineEditUrl'),
            popupProp = getCenterPopWinProp(800, 600),
            selectedInfo = getSelectedEntries(),
            selectLines = selectedInfo.selectLines,
            selectedLength = selectLines.length,
            maxSelectCount = 300,
            planIds;

        if (selectedLength === 0) {
            dialog.alert({
                title: '提示',
                message: '您没有勾选任何条目'
            });
            return false;
        } else if (selectedLength > maxSelectCount) {
            dialog.alert({
                title: '提示',
                message: '您单次勾选的条目太多，将可能导致更新失败，请减少后重试'
            });
            return false;
        }

        planIds = selectLines.map(function (line) {
            return line['custpage_internalid'];
        });

        window.open(inlineEditUrl + '&planids=' + planIds.join(','), null, popupProp.winProp);
    }

    // function plCancel() {
    //     var cancelUrl = getCache('cancelUrl'),
    //         popupProp = getCenterPopWinProp(800, 600),
    //         selectedInfo = getSelectedEntries(),
    //         selectLines = selectedInfo.selectLines,
    //         lineIndexs = selectedInfo.lineIndexs,
    //         selectedLength = selectLines.length,
    //         popWindow,
    //         submitPageHtml = '';

    //     if (selectedLength === 0) {
    //         dialog.alert({
    //             title: '提示',
    //             message: '您没有勾选任何条目'
    //         });
    //         return false;
    //     }

    //     //验证计划单状态
    //     for (var i = 0; i < selectedLength; i++) {
    //         if (selectLines[i]['custpage_custrecord_status_plan'] != approvedStatus) {
    //             dialog.alert({
    //                 title: '提示',
    //                 message: '您勾选的第' + (lineIndexs[i] + 1) + '行计划单状态不是已审核，不能进行取消'
    //             });
    //             return false;
    //         }
    //     }

    //     //只过滤需要的信息
    //     selectLines = selectLines.map(function (line) {
    //         return {
    //             'custpage_internalid': line['custpage_internalid'],
    //         };
    //     });

    //     if (!window.confirm('您确定要取消所选计划单吗?')) {
    //         return false;
    //     }

    //     submitPageHtml += '<!DOCTYPE html><html>'
    //         + '<head>'
    //         + '<meta charset="utf-8">'
    //         + '<title>计划单取消</title>'
    //         + '</head>'
    //         + '<body style="display:none;">'
    //         + '<form action="' + cancelUrl + '" method="post" id="dataMainForm">'
    //         + '<textarea name="dataEntries" id="dataEntries">' + JSON.stringify(selectLines) + '</textarea>'
    //         + '</form>'
    //         + '<script>document.getElementById("dataMainForm").submit();</script>'
    //         + '</body>'
    //         + '</html>';

    //     popWindow = window.open('', null, popupProp.winProp);
    //     popWindow.document.write(submitPageHtml);
    // }

    function plApprove() {
        var approveUrl = getCache('approveUrl'),
            popupProp = getCenterPopWinProp(800, 600),
            selectedInfo = getSelectedEntries(),
            selectLines = selectedInfo.selectLines,
            lineIndexs = selectedInfo.lineIndexs,
            selectedLength = selectLines.length,
            popWindow,
            submitPageHtml = '';

        if (selectedLength === 0) {
            dialog.alert({
                title: '提示',
                message: '您没有勾选任何条目'
            });
            return false;
        }

        // console.log('selectedInfo', selectedInfo);
        //验证计划单状态
        for (var i = 0; i < selectedLength; i++) {
            if (selectLines[i]['custpage_custrecord_status_plan'] != jihuazhongStatus) {
                dialog.alert({
                    title: '提示',
                    message: '您勾选的第' + (lineIndexs[i] + 1) + '行计划单状态不是计划中，不能进行审批'
                });
                return false;
            }
        }

        //只过滤需要的信息
        selectLines = selectLines.map(function (line) {
            return {
                'custpage_internalid': line['custpage_internalid'],
            };
        });

        // alert('功能开发中');return;

        if (!window.confirm('您确定要审批所选计划单吗?')) {
            return false;
        }

        submitPageHtml += '<!DOCTYPE html><html>'
            + '<head>'
            + '<meta charset="utf-8">'
            + '<title>计划单审批</title>'
            + '</head>'
            + '<body style="display:none;">'
            + '<form action="' + approveUrl + '" method="post" id="dataMainForm">'
            + '<textarea name="dataEntries" id="dataEntries">' + JSON.stringify(selectLines) + '</textarea>'
            + '</form>'
            + '<script>document.getElementById("dataMainForm").submit();</script>'
            + '</body>'
            + '</html>';

        popWindow = window.open('', null, popupProp.winProp);
        popWindow.document.write(submitPageHtml);
    }

    function goToPrPlatform() {
        window.location.assign(getCache('prPlatformUrl'));
    }

    //entry point
    function pageInit(context) {
        //初始化表格，调整格式
        window.requestAnimationFrame(initSublistTable);
        //将搜索功能暴露给全局，以便于弹窗进行刷新页面
        window.custSearchResults = searchResults;
        //缓存jq对象
        $ = jQuery;
        //初始化过滤条件
        var filters = (/filters=[^&]*/gmi.exec(decodeURIComponent(localStorage.pltoprplatformfilters)) || [])[0] || "filters=[]";
        initFilterExpress(JSON.parse(filters.slice("filters=".length)));
    }

    function fieldChanged(context) {
        var changedField = context.fieldId, pageRec = currentRecord.get(), index, value;
        //先检查是否为页码跳转
        if (changedField === pageIndexFieldId) {
            var pageIndex = pageRec.getValue({
                    fieldId: changedField
                });
            goToPage(pageIndex);
        } else if(index = changedField.indexOf("fieldid_fields_custpage_") > -1) {
            var currFIelidId = changedField.slice("fieldid_fields_custpage_".length) || "";
            var currTrNode = findFieldUIContainer(currFIelidId);
            value = pageRec.getValue(changedField);
            if(value) {
                var targetTrNode = findFieldUIContainer(value);
                pageRec.setValue({ fieldId: "fieldid_fields_custpage_" + value, value: value, ignoreFieldChange: true});
                pageRec.setValue({ fieldId: changedField, value: "", ignoreFieldChange: true});
                switchOpControls(pageRec, value);
                targetTrNode.style.display = "inline-block";
                currTrNode.parentElement.insertBefore(targetTrNode, currTrNode);
                currTrNode.style.display = currFIelidId? "none": "inline-block";
            } else {
                currTrNode.style.display = "none";
            }
        } else if(changedField.indexOf("operator_fields_custpage_") > -1) {
            switchOpControls(pageRec, changedField.slice("fieldid_fields_custpage_".length + 1) || "");
        }
    }

    function findFieldUIContainer(fieldId) {
        var node = document.querySelector("#main_form #fieldid_fields_custpage_" + fieldId + "_fs_lbl"), parentNode = node;
        while((parentNode = parentNode.parentElement) && parentNode.className != "uir-outside-fields-table");
        return parentNode && parentNode.parentElement.parentElement;
    }

    function switchOpControls(pageRec, fieldId) {
        var opValue = pageRec.getValue("operator_fields_custpage_" + fieldId);
        var trNode = findFieldUIContainer(fieldId);
        var tdNodes = trNode.querySelectorAll("table.uir-outside-fields-table>tbody>tr>td");
        if(/(within)|(between)/g.test(opValue)) {
            tdNodes[2].style.display = "";
            tdNodes[3].style.display = "";
            tdNodes[4].style.display = "none";
        } else {
            if(tdNodes[3]) {
                tdNodes[2].style.display = "none";
                tdNodes[3].style.display = "none";
                tdNodes[4].style.display = "";
            } else {
                tdNodes[2].style.display = "";
            }
        }
    }

    function initFilterExpress(filters) {
        var pageRec = currentRecord.get();
        debugger
        for(var i = 0, item; i < filters.length; i++) {
            item = filters[i];
            if(!Array.isArray(item)) { continue; }
            var fieldId = item[0], opName = item[1], values = item[2];
            if(values[0] == "T") { values[0] = true; }
            else if(values[0] == "F") { values[0] = false; }
            try{
                pageRec.setValue("fieldid_fields_custpage_", fieldId);
                pageRec.setValue("operator_fields_custpage_" + fieldId, opName);
                if(/(between)|(within)/gmi.test(opName)) {
                    pageRec.setValue("operator_fields_left_custpage_" + fieldId, values[0], true);
                    pageRec.setValue("operator_fields_right_custpage_" + fieldId, values[1], true);
                    pageRec.setValue("operator_fields_min_custpage_" + fieldId, values[0], true);
                    pageRec.setValue("operator_fields_max_custpage_" + fieldId, values[1], true);
                } else {
                    pageRec.setValue("values_fields_custpage_" + fieldId, values[0], true);
                }
            } catch(e) {
                if(/(between)|(within)/gmi.test(opName)) {
                    pageRec.setText("operator_fields_left_custpage_" + fieldId, values[0], true);
                    pageRec.setText("operator_fields_right_custpage_" + fieldId, values[1], true);
                    pageRec.setText("operator_fields_min_custpage_" + fieldId, values[0], true);
                    pageRec.setText("operator_fields_max_custpage_" + fieldId, values[1], true);
                } else {
                    pageRec.setText("values_fields_custpage_" + fieldId, values[0], true);
                }
            }
        }
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        goToPage: goToPage,
        searchResults: searchResults,
        setCustomPreference: setCustomPreference,
        plSeparate: plSeparate,
        plCombine: plCombine,
        plTransform: plTransform,
        plApprove: plApprove,
        plMassUpdate: plMassUpdate,
        // plCancel: plCancel,
        goToPrPlatform: goToPrPlatform,
    }
});