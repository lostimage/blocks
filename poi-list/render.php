<?php
/**
 * Points of Interest block render callback
 *
 * This file renders the POI block on the frontend. It handles the display of
 * selected POIs from various post types, with highlighted items shown first,
 * followed by recent posts ordered by date.
 *
 * @package itm-core
 * @since 1.0.0
 */

$selected_post_type       = $attributes['selectedPostType'] ?? 'campsites';
$highlighted_pois         = $attributes['highlightedPOIs'] ?? array();
$block_wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'itm-poi-list alignwide' ) );

$highlighted_pois_str = implode( ',', $highlighted_pois );
?>

<section <?php echo $block_wrapper_attributes; ?> data-post-type="<?php echo esc_attr( $selected_post_type ); ?>"
                                                  data-highlighted="<?php echo esc_attr( $highlighted_pois_str ); ?>">
	<?php
	if ( ! is_admin() ) {
		/**
		 * Render the POIs on the frontend
		 *
		 * @param string $selected_post_type The selected post type
		 * @param array $highlighted_pois Array of highlighted POI IDs to show first
		 * @param int $max_items Maximum number of items to display
		 */
		get_template_part(
			'template-parts/poi/poi-elements',
			null,
			array(
				'post_type'        => $selected_post_type,
				'highlighted_pois' => $highlighted_pois,
			)
		);
	}
	?>
</section>
