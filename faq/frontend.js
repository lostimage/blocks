'use strict';

import Fuse from 'fuse.js';

const faqGroups = document.querySelectorAll('.faq__group');
const faqParents = document.querySelectorAll('.faq__item');
const faqItems = document.querySelectorAll('.faq__question');
const faqSearch = document.querySelector('.faq__search');
const faqEmpty = document.querySelector('.faq__group--empty');

const getSearchParam = (param) => {
	const queryString = window?.location?.search;
	let searchParam = '';

	if (!queryString) {
		return searchParam;
	}

	const urlParams = new URLSearchParams(queryString);
	searchParam = urlParams.get(param);

	return searchParam;
};

if (faqItems) {
	faqItems.forEach((item) => {
		item.addEventListener('click', () => {
			item.closest('.faq__item').classList.toggle('active');
		});
	});

	if (faqSearch) {
		const faqSearchInput = faqSearch.querySelector('input');

		const list = [];
		faqItems.forEach((item) => {
			list.push({
				question: item.innerText,
				answer: item.nextSibling.nextSibling.innerText,
				id: item.closest('.faq__item').dataset.id,
			});
		});

		const options = {
			keys: ['question', 'answer'],
			threshold: 0.2,
			ignoreLocation: true,
			includeMatches: true,
			includeScore: true,
			useExtendedSearch: true,
			findAllMatches: false,
			ignoreFieldNorm: true,
		};

		const fuse = new Fuse(list, options);

		faqSearchInput.addEventListener('keyup', () => {
			faqEmpty.classList.remove('active');
			const query = faqSearchInput.value;
			if (query.length > 2) {
				const searchResult = fuse.search(query);

				if (searchResult.length) {
					faqGroups.forEach((item) => (item.style.display = 'none'));
					faqParents.forEach((item) => (item.style.display = 'none'));

					searchResult.forEach((item) => {
						document
							.querySelectorAll(
								'.faq__item[data-id="' + item.item.id + '"]'
							)
							.forEach((item) => (item.style.display = 'block'));
						document
							.querySelectorAll(
								'.faq__item[data-id="' + item.item.id + '"]'
							)
							.forEach(
								(item) =>
									(item.closest('.faq__group').style.display =
										'flex')
							);
					});
				} else {
					faqGroups.forEach((item) => (item.style.display = 'none'));
					faqParents.forEach((item) => (item.style.display = 'none'));
					faqEmpty.classList.add('active');
					faqEmpty.querySelector('span').innerText =
						'"' + query + '"';
				}
			} else {
				faqGroups.forEach((item) => (item.style.display = 'flex'));
				faqParents.forEach((item) => (item.style.display = 'block'));
				faqEmpty.classList.remove('active');
			}
		});
	}
}

const tpickers = document.querySelectorAll('.tpicker');

if (tpickers) {
	const tpickerWraps = document.querySelectorAll('.tpicker__wrap');

	tpickers.forEach((tpicker) => {
		const tpickerValue = tpicker.querySelector('.tpicker__value');
		const tpickerOptions = tpicker.querySelectorAll('.tpicker__option');
		const tpickerWrap = tpicker.querySelector('.tpicker__wrap');

		tpickerOptions.forEach((tpickerOption) => {
			tpickerOption.addEventListener('click', () => {
				tpickerWraps.forEach((item) => item.classList.remove('active'));
			});
		});

		tpickerValue.addEventListener('click', () => {
			tpickerWraps.forEach(
				(item) =>
					item !== tpickerWrap && item.classList.remove('active')
			);
			tpickerWrap.classList.toggle('active');
		});
	});

	document.addEventListener('click', (e) => {
		if (e.target.closest('.tpicker')) return;
		tpickerWraps.forEach((item) => item.classList.remove('active'));
	});
}

const faqNavSearch = document.querySelector('.faq-nav__search');

if (faqNavSearch) {
	const searchInput = faqSearch.querySelector('input');

	faqNavSearch.addEventListener('click', () => {
		window.requestAnimationFrame(() => {
			faqNavSearch.classList.remove('is-active');
		});
		searchInput.focus();
	});

	const searchParam = getSearchParam('s_faq');

	if ('' !== searchParam) {
		searchInput.value = searchParam;
		searchInput.dispatchEvent(new Event('keyup'));
	}
}
