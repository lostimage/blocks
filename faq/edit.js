import {
	useEffect,
	RawHTML, useRef
} from '@wordpress/element';
import {InspectorControls, useBlockProps} from '@wordpress/block-editor';
import {
	PanelBody,
	ToolbarGroup,
	ToolbarDropdownMenu,
	RadioControl,
	TextControl,
	TextareaControl,
	ComboboxControl, BaseControl, Button,
} from '@wordpress/components';
import Sortable from 'gutenberg-sortable';

import { useSelect } from '@wordpress/data';
import './editor.scss';

import remove from '../../assets/img/remove_rating.svg';
import {__} from "@wordpress/i18n";

export default function Edit({ attributes, setAttributes }) {
	const {
		categories,
		layout,
		title,
		subtitle,
	} = attributes;

	const radioContainer = useRef();

	const data = useSelect(
		(select) => {
			return select('core').getEntityRecords('taxonomy', 'faq_category', {
				per_page: 100,
			});
		},
	);

	const faqs = useSelect(
		(select) => {
			return select('core').getEntityRecords('postType', 'faq', {
				per_page: 100,
			});
		},
	);

	useEffect(() => {
		if (!categories) {
			setAttributes({ categories: data });
		}
	}, data);

	const handleSortEnd = (items) => {
		setAttributes({ categories: items.filter(item => item !== undefined) });
	}

	const handleCategoryRemove = (categoryId) => {
		const newCategories = categories.filter((item) => item.id !== categoryId);
		setAttributes({ categories: newCategories });
	}

	const onSelectCategory = (categoryId) => {
		const selectedCategory = data.find((category) => category.id === categoryId);
		setAttributes({
			categories: categories
				? [...categories, selectedCategory]
				: [selectedCategory],
		});
	}

	return (
		<div {...useBlockProps({
			className: 'faq__block',
		})}>
			<InspectorControls>
				<PanelBody title={__('Layout')} initialOpen={true}>
					<RadioControl
						label=""
						ref={radioContainer}
						options={[
							{
								label: 'Advanced',
								value: 'default'
							},
							{
								label: 'Simplified',
								value: 'simplified'
							}
						]}
						selected={layout}
						onChange={(newValue) => {
							setAttributes({
								layout: newValue
							})
						}}
					/>
				</PanelBody>
				{'simplified' === layout && (
					<PanelBody title={__('Heading')} initialOpen={true}>
						<TextControl
							label="Title"
							value={title}
							onChange={(newValue) => {
								setAttributes({
									title: newValue
								})
							}}
						/>
						<TextareaControl
							label="Subtitle"
							value={subtitle}
							onChange={(newValue) => {
								setAttributes({
									subtitle: newValue
								})
							}}
						/>
					</PanelBody>
				)}
			</InspectorControls>

			<div className='container'>
				<div className='faq__head'>
					<div className='faq__navs'>
						{categories && (
							<Sortable
								items={categories}
								axis='x'
								onSortEnd={handleSortEnd}
							>
								{categories.map(category => (
									<span className='faq__nav'>
										{category && category.name}
										<span
											className='faq__remove'
											onMouseUp={() => handleCategoryRemove(category.id)}
										>
											<img src={remove} />
										</span>
									</span>
								))}
							</Sortable>
						)}
						{data && categories && (
							<span className='faq__add'>
								<ToolbarGroup>
									<ToolbarDropdownMenu
										icon="plus"
										label="Add Rating"
										controls={
											data.
												filter(
													aCat => !categories.some(sCat => aCat.id === sCat.id)
												).map((item) => ({
													title: item.name,
													onClick: () => onSelectCategory(item.id),
												}))
										}
									/>
								</ToolbarGroup>
							</span>
						)}
						{!data || !data.length && (
							'Faq categories not found'
						)}
					</div>
					{'simplified' !== layout && (
						<div className='faq__search'>
							<input placeholder='Search' />
							<div className='faq__search-btn'>
								<i className='icon icon--io-search'></i>
							</div>
						</div>
					)}
				</div>
				{categories && faqs &&
					categories.map(category => (
						<div className='faq__group'>
							<div className='faq__heading'>
								<h2>{category.name}</h2>
							</div>
							<div className='faq__items'>
								{faqs
									.filter(faq => faq.faq_category.includes(category.id))
									.map(faq => (
										<div className='faq__item'>
											<div className='faq__question'>
												{<RawHTML>
													{faq.title.rendered}
												</RawHTML>}
												<div className='faq__expander'></div>
											</div>
											<div className='faq__answer'>
												{<RawHTML>
													{faq.content.rendered}
												</RawHTML>}
											</div>
										</div>
									)
									)}
								{!faqs.filter(faq => faq.faq_category.includes(category.id)).length && (
									'No items found in category'
								)}
							</div>
						</div>
					))
				}
			</div>
		</div>
	);
}
