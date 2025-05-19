<?php
$post_type        = $args['post_type'] ?? 'campsites';
$highlighted_pois = $args['highlighted_pois'] ?? array();
//@todo update post per page value from admin
$args = array(
	'post_type'      => $post_type,
	'order'          => 'ASC',
	'orderby'        => 'menu_order',
	'posts_per_page' => 500,
);

$all_posts_query   = new WP_Query( $args );
$highlighted_posts = array();
$regular_posts     = array();
?>
<div class="itm-poi-list-container" data-map-id="map1">
    <div class="itm-poi-map-wrapper js-poi-map-container">
        <div class="itm-poi-map"></div>
    </div>
    <div class="container">
		<?php
		get_template_part(
			slug: 'template-parts/poi-filter/top-section',
			args: [

			]
		);

		if ( $all_posts_query->have_posts() ) : ?>
            <div class="itm-poi-items itm-grid">
				<?php
				while ( $all_posts_query->have_posts() ) :
					$all_posts_query->the_post();
					$post_id = get_the_ID();

					if ( in_array( $post_id, $highlighted_pois ) ) :
						$position                       = array_search( $post_id, $highlighted_pois );
						$highlighted_posts[ $position ] = get_post();
					else :
						$regular_posts[] = get_post();
					endif;
				endwhile;

				wp_reset_postdata();

				ksort( $highlighted_posts );

				if ( ! empty( $highlighted_posts ) ) :
					foreach ( $highlighted_posts as $post ) :
						setup_postdata( $post );
						get_template_part(
							slug: 'template-parts/poi/poi-item',
							args: array( 'post_type' => $post_type )
						);
					endforeach;
					wp_reset_postdata();
				endif;
				if ( ! empty( $regular_posts ) ) :
					foreach ( $regular_posts as $post ) :
						setup_postdata( $post );
						get_template_part(
							slug: 'template-parts/poi/poi-item',
							args: array( 'post_type' => $post_type )
						);
					endforeach;
					wp_reset_postdata();
				endif;
				?>
            </div>
		<?php endif; ?>
    </div>
</div>
