/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	RangeControl,
	RadioControl,
	FormTokenField,
	ToggleControl,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import FilterList from './FilterList';
import './editor.scss';

export default function Edit( { attributes, setAttributes } ) {
	const blockProps = useBlockProps();
	const {
		queryType,
		postsPerPage,
		category,
		order,
		selectedTaxonomies,
		taxValues,
		selectedTaxValues,
		filterTaxonomies,
		showFilters,
		taxLoading,
	} = attributes;

	// Fetch categories
	const categories = useSelect( ( select ) => {
		return select( coreStore ).getEntityRecords( 'taxonomy', 'category', {
			per_page: -1,
		} );
	}, [] );

	// Build category options
	const categoryOptions = categories ? [
		{ label: 'All Categories', value: '' },
		...categories.map( ( category ) => ( {
			label: category.name,
			value: category.id.toString(),
		} ) ),
	] : [];

	const orderOptions = [
		{ label: 'Descending', value: 'DESC' },
		{ label: 'Ascending', value: 'ASC' },
	];

	const taxonomies = useSelect( ( select ) => {
		return select( coreStore ).getTaxonomies( { per_page: -1 } ) || [];
	}, [] );

	useEffect( () => {
		if ( taxonomies && taxonomies.length > 0 ) {
			const tax = taxonomies
				.filter( ( taxonomy ) => taxonomy.types.includes( 'shorts' ) )
				.map( ( taxonomy ) => ( {
					name: taxonomy.name,
					id: taxonomy.slug,
				} ) );
			setAttributes( { filterTaxonomies: tax } );
		}
	}, [ taxonomies, setAttributes ] );

	const terms = useSelect( ( select ) => {
		if ( ! selectedTaxonomies.length ) {
			return [];
		}

		return select( coreStore ).getEntityRecords(
			'taxonomy',
			selectedTaxonomies[ 0 ],
			{
				per_page: -1,
				hide_empty: true,
				_fields: [ 'id', 'name', 'meta' ],
				context: 'view',
			}
		);
	}, [ selectedTaxonomies ] );

	useEffect( () => {
		if ( terms ) {
			const formattedTerms = terms.map( ( term ) => ( {
				id: term.id,
				name: term.name,
				meta: term.meta || {},
			} ) );

			setAttributes( {
				taxValues: formattedTerms,
				taxLoading: false,
			} );
		}
	}, [ terms, setAttributes ] );

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Shorts Query Settings', 'short-reels' ) }>
					<RadioControl
						label={ __( 'Selection Type', 'short-reels' ) }
						selected={ queryType }
						options={ [
							{ label: 'Chronological', value: 'chronological' },
							{ label: 'Category', value: 'category' },
							{ label: 'Recommendation', value: 'recommendation' },
						] }
						onChange={ ( value ) => setAttributes( { queryType: value } ) }
					/>

					{ queryType === 'category' && (
						<SelectControl
							label={ __( 'Category', 'short-reels' ) }
							value={ category }
							options={ categoryOptions }
							onChange={ ( value ) => setAttributes( { category: value } ) }
						/>
					) }

					{ queryType === 'chronological' && (
						<>
							<RangeControl
								label={ __( 'Posts per page', 'short-reels' ) }
								value={ postsPerPage }
								onChange={ ( value ) => setAttributes( { postsPerPage: value } ) }
								min={ 1 }
								max={ 20 }
							/>
							<SelectControl
								label={ __( 'Order', 'short-reels' ) }
								value={ order }
								options={ orderOptions }
								onChange={ ( value ) => setAttributes( { order: value } ) }
							/>
						</>
					) }

					{ queryType === 'recommendation' && (
						<p className="description">
							{ __( 'Recommendation feature - Coming soon', 'short-reels' ) }
						</p>
					) }
				</PanelBody>

				<PanelBody title={ __( 'Filter Settings', 'short-reels' ) }>
					<ToggleControl
						label={ __( 'Show Filters', 'short-reels' ) }
						checked={ showFilters }
						onChange={ ( value ) => {
							setAttributes( {
								showFilters: value,
								...( ( ! value ) ? {
									selectedTaxonomies: [],
									taxValues: [],
									selectedTaxValues: [],
								} : {} ),
							} );
						} }
					/>

					{ showFilters && (
						<>
							<SelectControl
								multiple
								label={ __( 'Select Taxonomy', 'short-reels' ) }
								value={ selectedTaxonomies }
								options={ filterTaxonomies.map( ( tax ) => ( {
									label: tax.name,
									value: tax.id,
								} ) ) }
								onChange={ ( selected ) => setAttributes( {
									selectedTaxonomies: selected,
									taxValues: [],
									selectedTaxValues: [],
								} ) }
							/>
							{ taxValues && taxValues.length > 0 && (
								<FormTokenField
									label={ __( 'Select Terms', 'short-reels' ) }
									value={ selectedTaxValues.map( ( tax ) => tax.name ) }
									suggestions={ taxValues.map( ( tax ) => tax.name ) }
									onChange={ ( newValue ) => {
										const updatedTaxonomies = newValue.map( ( name ) => {
											const foundTerm = taxValues.find( ( term ) => term.name === name );
											return foundTerm ? {
												id: foundTerm.id,
												name: foundTerm.name,
												meta: foundTerm.meta || {},
											} : {
												name,
												id: null,
												meta: {},
											};
										} );
										setAttributes( { selectedTaxValues: updatedTaxonomies } );
									} }
								/>
							) }

						</>
					) }
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div className="shorts-preview">
					{ showFilters && (
						<>
							{ taxLoading ? (
								<p style={ { textAlign: 'center' } }><Spinner /></p>
							) : selectedTaxValues.length > 0 ? (
								<FilterList
									taxonomies={ selectedTaxValues }
									selectedTaxonomy={ selectedTaxonomies[ 0 ] }
								/>
							) : (
								taxonomies.length && ! taxValues.length &&
								__( 'Select options to show filters', 'short-reels' )
							) }
						</>
					) }
					{ queryType === 'category' && (
						<>
							Category: { categoryOptions.find( ( opt ) => opt.value === category )?.label || 'All Categories' }
						</>
					) }
					{ queryType === 'chronological' && (
						<>
							Display: Chronological
							<br />
							Posts per page: { postsPerPage }
							<br />
							Order: { order }
						</>
					) }
					{ queryType === 'recommendation' && (
						<>
							Display: Recommendation (Coming Soon)
						</>
					) }
				</div>
			</div>
		</>
	);
}
