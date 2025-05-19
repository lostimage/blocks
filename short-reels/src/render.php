<?php
/**
 * Render template for Short Reels block
 *
 * @package JW_REELS
 * @since 1.0.0
 */

$short_post_id       = isset( $_GET['short_post_id'] ) ? sanitize_text_field( $_GET['short_post_id'] ) : ''; //phpcs:ignore WordPress.Security.NonceVerification.Recommended
$attributes          = $args['attributes'] ?? [];
$preload_images      = $attributes['preloadImages'] ?? 2;
$query_type          = $attributes['queryType'] ?? 'chronological';
$show_filters        = $attributes['showFilters'] ?? false;
$selected_taxonomies = $attributes['selectedTaxonomies'] ?? [];
$selected_tax_values = $attributes['selectedTaxValues'] ?? [];
$selected_category   = isset( $_GET['reels-category'] ) ? sanitize_text_field( $_GET['reels-category'] ) : ( $attributes['category'] && 'category' === $query_type ?? '' ); //phpcs:ignore WordPress.Security.NonceVerification.Recommended

$wrapper_attributes = get_block_wrapper_attributes(
	[
		'class'     => 'bn-relative md:bn-overflow-hidden',
		'data-attr' => wp_json_encode(
			[
				'posts_per_page' => min( $attributes['postsPerPage'] ?? 6, 20 ),
				'order'          => $attributes['order'] ?? 'DESC',
				'orderby'        => $attributes['orderBy'] ?? 'date',
				'category'       => $attributes['category'] ?? '',
			]
		),
	]
);

$query_args = [
	'post_type'      => 'shorts',
	'posts_per_page' => min( intval( $attributes['postsPerPage'] ?? 6 ), 20 ),
];

if ( ! empty( $selected_category ) ) {
	$query_args['cat'] = $selected_category;
}

switch ( $query_type ) {
	case 'category':
		if ( ! empty( $attributes['category'] ) ) {
			$query_args['cat'] = $attributes['category'];
		}
		$query_args['orderby'] = 'date';
		$query_args['order']   = 'DESC';
		break;

	case 'chronological':
		$query_args['orderby'] = 'date';
		$query_args['order']   = $attributes['order'] ?? 'DESC';
		break;

	case 'recommendation':
		// TODO: Implement recommendation logic here.
		$query_args['orderby'] = 'date';
		$query_args['order']   = 'DESC';
		break;
}

$shorts_query = get_posts( $query_args );
if ( ! empty( $short_post_id ) ) {
	$short_post = get_post( $short_post_id );

	if ( $short_post && 'shorts' === $short_post->post_type ) {
		$shorts_query = array_filter(
			$shorts_query,
			function ( $post_item ) use ( $short_post_id ) {
				return $post_item->ID !== (int) $short_post_id;
			}
		);

		array_unshift( $shorts_query, $short_post );
	}
}
$active_filter_id = $selected_category;
?>

<div <?php echo wp_kses_post( $wrapper_attributes ); ?> data-query-category="<?php echo esc_attr( $selected_category ); ?>">
	<?php if ( ! empty( $attributes['heading'] ) ) : ?>
		<h2 class="bn-text-wp-large bn-font-bold bn-break-words bn-text-pretty has-text-color bn-text-[var(--text-primary)]">
			<?php echo esc_html( $attributes['heading'] ); ?>
		</h2>
	<?php endif; ?>

	<?php if ( $show_filters && ! empty( $selected_taxonomies ) && ! empty( $selected_tax_values ) ) : ?>
		<div class="short-reels-filters" data-selected-taxonomy="<?php echo esc_attr( $selected_taxonomies[0] ?? '' ); ?>">
			<ul class="bn-flex bn-gap-2 bn-list-none bn-p-0 bn-m-0 bn-mb-4">
				<li data-tax-id="" class="<?php echo empty( $active_filter_id ) ? 'selected' : ''; ?> js-filter-reels bn-px-4 bn-py-2 bn-cursor-pointer bn-transition-colors bn-bg-primary bn-text-white">
					🌏 <?php esc_html_e( 'All', 'moniify' ); ?>
				</li>
				<?php
				if ( ! empty( $selected_tax_values ) ) :
					foreach ( $selected_tax_values as $tax_item ) :
						?>
						<li data-tax-id="<?php echo esc_attr( $tax_item['id'] ?? '' ); ?>" class=" <?php echo esc_attr( ( (int) $active_filter_id === (int) $tax_item['id'] ) ? 'selected' : '' ); ?> bn-px-4 js-filter-reels bn-py-2 bn-cursor-pointer bn-transition-colors bn-bg-gray-100 hover:bn-bg-gray-200">
							<?php
							$emoji = ! empty( $tax_item['meta']['_emoji'] ) ? $tax_item['meta']['_emoji'] : '';
							echo esc_html( $emoji . ' ' . $tax_item['name'] );
							?>
						</li>
						<?php
					endforeach;
				endif;
				?>
			</ul>
		</div>
	<?php endif; ?>

	<div class="bn-w-100 bn-flex max-md:bn-flex-wrap bn-video-tiles js-jw-reels-container bn-gap-x-[4%] sm:bn-gap-x-[2%] lg:bn-gap-x-[0.5rem] bn-gap-y-4 sm:bn-gap-y-3.5 md:bn-gap-y-5 lg:bn-gap-y-3.5">
		<?php if ( ! empty( $shorts_query ) ) : ?>
			<?php foreach ( $shorts_query as $index => $current_post ) : ?>
				<?php
				jw_reels_load_template(
					'article.php',
					[
						'post'    => $current_post,
						'preload' => $index < $preload_images,
						'attrs'   => [
							'sizes' => '64px',
						],
					]
				);
				?>
			<?php endforeach; ?>
		<?php endif; ?>
		<div class="jw-reels-loader"></div>
	</div>
</div>

