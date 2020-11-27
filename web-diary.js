'use strict';

import { removeAllChildren } from './modules/module.js';

// ツールバー
const createButton = document.getElementById('create-button');
const saveButton = document.getElementById('save-button');
const deleteButton = document.getElementById('delete-button');
const searchButton = document.getElementById('search-button');
const closeButton = document.getElementById('close-button');
const helpButton = document.getElementById('help-button');
const addFileInput = document.getElementById('add-file-input');

// メインコンテンツ
const titleInput = document.getElementById('title-input');
const contentArea = document.getElementById('content-area');
const createdDate = document.getElementById('created-date');
const saveList = document.getElementById('save-list');

// ダイアログ
const searchDialog = document.getElementById('search-dialog');
const searchDialogCloseButton = document.getElementById('search-dialog-close-button');
const searchInput = document.getElementById('search-input');
const helpDialog = document.getElementById('help-dialog');
const helpDialogCloseButton = document.getElementById('help-dialog-close-button');

// ドラッグ禁止
document.ondragstart = () => false;

/**
 * 日付の桁を揃える
 * @param {Number} number 日付の数値
 * @return {String} 整形された日付の文字列
 */
function format(number) {
    if (number < 10) {
        number = `0${number}`;
    }
    return number;
}

/**
 * 日付の文字列を返す
 * @return {String} 日付の文字列
 */
function date() {
    const now = new Date();
    const year = now.getFullYear();
    const month = format(now.getMonth() + 1);
    const date = format(now.getDate());
    const hour = format(now.getHours());
    const min = format(now.getMinutes());
    const second = format(now.getSeconds());
    const dayOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${year}/${month}/${date} ${hour}:${min}:${second} ${dayOfWeek[now.getDay()]}`;
}

/**
 * リストアイテムのスタイルを設定する
 * @param {HTMLElement} listItem 選択した項目
 */
function listStyle(listItem) {
    for (let savedItem of saveList.getElementsByClassName('saved-item')) {
        savedItem.style.display = 'flex';
        savedItem.style.backgroundColor = '#ffffff';
        listItem.style.backgroundColor = '#eeeeee';
    }
}

// リスト内を検索する
searchButton.onclick = () => {
    closeButton.onclick();
    if (!searchDialog.hasAttribute('open')) {
        try {
            searchDialog.showModal();
        } catch (e) {
            // TODO Firefox でも動作するように修正
            alert('この機能は現在 Google Chrome でのみ利用できます');
        }
    }
    searchDialogCloseButton.onclick = () => {
        searchInput.value = null;
        searchDialog.close();
    }
    searchDialog.addEventListener('cancel', () => {
        searchInput.value = null;
    }, false);
    searchInput.addEventListener('change', () => {
        searchDialog.close(searchInput.value);
        searchInput.value = null;
        let keyword = new RegExp(searchDialog.returnValue, 'i');
        for (let target of saveList.getElementsByClassName('saved-item')) {
            if (!keyword.test(target.textContent)) {
                target.style.display = 'none';
            }
        }
    }, false);
}

// ヘルプを表示
helpButton.onclick = () => {
    if (!helpDialog.hasAttribute('open')) {
        try {
            helpDialog.showModal();
        } catch (e) {
            // TODO Firefox でも動作するように修正
            alert('この機能は現在 Google Chrome でのみ利用できます');
        }
    }
}

// ヘルプを非表示
helpDialogCloseButton.onclick = () => {
    helpDialog.close();
}

// 画像、動画を添付する
addFileInput.addEventListener('change', event => {
    const file = event.target.files[0];
    if (file.size >= 1048576) {
        alert(`“${file.name}”を添付できませんでした。\n1MB以下のファイルを添付できます。`);
        addFileInput.value = null;
        return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = e => {
        if (file.type === 'video/mp4') {
            const video = document.createElement('video');
            video.setAttribute('contenteditable', 'false');
            video.setAttribute('controlslist', 'nodownload');
            video.setAttribute('disablepictureinpicture', '');
            video.setAttribute('controls', '');
            video.setAttribute('autoplay', '');
            video.setAttribute('loop', '');
            video.src = e.target.result;
            contentArea.appendChild(video);
        } else {
            const image = new Image();
            image.src = e.target.result;
            contentArea.appendChild(image);
        }
    }
    addFileInput.value = null;
}, false);

/**
 * ローカルストレージに記事を保存する
 * @param {String} key 保存するキーの名称
 */
function save(key) {
    if (titleInput.value.length === 0) {
        titleInput.value = 'Untitled';
    }
    const diary = {
        title: titleInput.value,
        content: contentArea.innerHTML,
        createdAt: date()
    }
    try {
        localStorage.setItem(key, JSON.stringify(diary));
    } catch (error) {
        titleInput.value = null;
        load(saveList.querySelector(`li[data-key="${key}"]`) || saveList.firstChild);
        alert(`“${diary.title}”を保存できませんでした。\nローカルストレージの空き領域が不足しています。`);
        console.warn(`ローカルストレージの空き領域が不足しています`, error);
    }
    addToList(key);
}

/**
 * 保存したデータをリストに追加する
 * @param {String} key キーの名称
 */
function addToList(key) {
    const container = document.createElement('div');
    const video = document.createElement('video');
    const image = document.createElement('img');
    const title = document.createElement('h3');
    const text = document.createElement('p');
    container.className = 'container';
    video.className = 'thumbnail';
    image.className = 'thumbnail';
    title.className = 'list-title';
    text.className = 'list-text';
    if (contentArea.getElementsByTagName('video').length) {
        video.setAttribute('loop', '');
        video.setAttribute('muted', '');
        video.setAttribute('autoplay', '');
        video.setAttribute('disablepictureinpicture', '');
        video.src = contentArea.getElementsByTagName('video')[0].src;
        container.appendChild(video);
    } else if (contentArea.getElementsByTagName('img').length) {
        image.src = contentArea.getElementsByTagName('img')[0].src;
        container.appendChild(image);
    } else {
        image.src = './images/no-image.png';
        container.appendChild(image);
    }
    title.innerText = titleInput.value;
    container.appendChild(title);
    text.innerText = contentArea.textContent;
    container.appendChild(text);
    titleInput.value = null;
    if (saveList.querySelector(`li[data-key="${key}"]`)) {
        const savedItem = saveList.querySelector(`li[data-key="${key}"]`);
        removeAllChildren(savedItem);
        savedItem.appendChild(container);
        load(savedItem);
    } else {
        const savedItem = document.createElement('li');
        savedItem.className = 'saved-item';
        savedItem.dataset.key = key;
        savedItem.setAttribute('onclick', 'load(this)');
        savedItem.appendChild(container);
        saveList.insertBefore(savedItem, saveList.firstChild);
        load(savedItem);
    }
}

// 新規作成
createButton.addEventListener('click', create, false);

/**
 * 新しく記事を作成する
 */
function create() {
    titleInput.value = null;
    removeAllChildren(contentArea);
    removeAllChildren(createdDate);
    save(`diary_${Date.now()}`);
}

/**
 * 引数に渡されたキーを削除する
 * @param {String} key 削除するキーの名称
 */
function remove(key) {
    localStorage.removeItem(key);
    if (saveList.querySelector(`li[data-key="${key}"]`)) {
        saveList.querySelector(`li[data-key="${key}"]`).remove();
    }
    saveList.firstChild ? load(saveList.firstChild) : create();
}

/**
 * ローカルストレージからデータを取得して表示する
 * @param {String} key 取得するキーの名称
 */
function output(key) {
    const diary = JSON.parse(localStorage.getItem(key));
    titleInput.value = diary.title;
    contentArea.innerHTML = diary.content;
    createdDate.innerText = diary.createdAt;
}

/**
 * 引数に渡された要素の情報を取得して操作する
 * @param {HTMLElement} listItem 選択した要素
 */
function load(listItem) {
    listStyle(listItem);
    listItem.scrollIntoView({ behavior: 'smooth' });
    const key = listItem.dataset.key;
    if (localStorage.getItem(key)) {
        try {
            output(key);
        } catch (error) {
            remove(key);
            console.warn(`“${key}” のデータを取得できませんでした`, error);
        }
        saveButton.onclick = () => save(key);
        closeButton.onclick = () => listStyle(listItem);
        deleteButton.onclick = () => remove(key);
    } else {
        remove(key);
        console.warn(`“${key}” の値を取得できません`);
    }
}

// ページ読み込み時
window.onload = () => {
    const items = new Array();
    for (let i = 0; i < localStorage.length; i++) {
        items.push(localStorage.key(i));
    }
    const keys = items
        .filter(item => /diary_\d+/.test(item))
        .sort((a, b) => parseInt(a.split('_')[1]) - parseInt(b.split('_')[1]));
    if (keys.length === 0) {
        create();
        return;
    }
    keys.forEach(key => {
        try {
            output(key);
            addToList(key);
        } catch (error) {
            remove(key);
            console.warn(`“${key}” のデータを取得できませんでした`, error);
        }
    });
    console.assert(
        keys.length === saveList.childElementCount,
        `リストの項目数が正しくありません`
    );
}