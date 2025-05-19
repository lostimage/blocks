<?php
/**
 * Custom Gutenberg block
 *
 * @package campeasy
 * @since 1.0.0
 */

$selected_categories      = $attributes['categories'] ?? [];
$layout                   = $attributes['layout'] ?? 'default'; // possible values: default, simplified.
$title                    = $attributes['title'] ?? '';
$subtitle                 = $attributes['subtitle'] ?? '';
$is_simplified            = 'simplified' === $layout;
$filtered_categories      = [];
$additional_classes         = $is_simplified ? 'itm-faq layout-simplified' : 'itm-faq';
$block_wrapper_attributes = get_block_wrapper_attributes( [ 'class' => $additional_classes ] );

foreach ( $selected_categories as $selected_category ) {
	$category_term = get_term( $selected_category['id'] );

	if ( ! empty( $selected_category ) && ! is_wp_error( $selected_category ) ) {
		$filtered_categories[] = $category_term;
	}
}

?>

<div <?php echo wp_kses_data( $block_wrapper_attributes ); ?>>
	<div class="container">
		<?php if ( $is_simplified && ($title || $subtitle) ) : ?>
		    <div class="itm-faq__header">
				<?php if ( $title ) : ?>
				    <h2 class="itm-faq__title"><?php echo esc_html( $title ); ?></h2>
				<?php endif; ?>
				<?php if ( $subtitle ) : ?>
					<div class="itm-faq__subtitle"><?php echo esc_html( $subtitle ); ?></div>
				<?php endif; ?>
			</div>
		<?php endif; ?>

		<div class="itm-faq__groups">
			<?php if ( ! $is_simplified ) : ?>
				<div class="faq__head">
					<?php if(count($filtered_categories) > 1) : ?>
						<div class="faq__navs visible-lg-up" id="filters-nav-display">
							<?php foreach ( $filtered_categories as $current_category ) : ?>
								<a href="#<?php echo esc_html( $current_category->slug ); ?>" class='faq__nav'>
									<?php echo esc_html( $current_category->name ); ?>
								</a>
							<?php endforeach; ?>
						</div>
					<?php endif; ?>
					<div class="tpicker hidden-lg-up">
						<div class="tpicker__value"><?php esc_html_e( 'Topic', 'campeasy' ); ?>    </div>
						<div class="tpicker__wrap">
							<div class="tpicker__options">
								<?php foreach ( $filtered_categories as $current_category ) : ?>
									<a href="#<?php echo esc_html( $current_category->slug ); ?>" class='tpicker__option'>
										<?php echo esc_html( $current_category->name ); ?>
									</a>
								<?php endforeach; ?>
							</div>
						</div>
					</div>
					<div class='faq__search'>
						<input placeholder='Search'/>
						<div class='faq__search-btn'>
							<i class='icon icon--io-search'></i>
						</div>
					</div>
				</div>
			<?php endif; ?>

			<div class="faq__group faq__group--empty">
				<div class="faq__heading"></div>
				<div class="faq__items">
					<?php esc_html_e( 'We`re sorry. We were not able to find a result for', 'campeasy' ); ?>
					<span></span>
					<?php esc_html_e( '. Try to search for something less specific', 'campeasy' ); ?>
				</div>
			</div>
			<?php foreach ( $filtered_categories as $current_category ) : ?>
				<div class='faq__group' id="<?php echo esc_html( $current_category->slug ); ?>">
					<div class='faq__heading'>
						<?php if ( $is_simplified  ) : ?>
							<h3><?php echo esc_html( $current_category->name ); ?></h3>
						<?php else : ?>
							<h2><?php echo esc_html( $current_category->name ); ?></h2>
						<?php endif; ?>
					</div>
					<div class='faq__items'>
						<?php
						$args = [
							'posts_per_page'=> -1,
							'post_type' => 'faq',
							'tax_query' => [
								[
									'taxonomy' => 'faq_category',
									'field'    => 'term_id',
									'terms'    => $current_category->term_id,
								],
							],
						];

						$faq_query = new WP_Query( $args );

						if ( $faq_query->have_posts() ) {
							while ( $faq_query->have_posts() ) :
								$faq_query->the_post();
								$faq[] = [
									'@type'          => 'Question',
									'name'           => wp_strip_all_tags( get_the_title() ),
									'acceptedAnswer' => [
										'@type' => 'Answer',
										'text'  => wp_strip_all_tags( get_the_content() ),
									],
								]
								?>
								<div class='faq__item' data-id="<?php echo esc_attr( get_the_id() ); ?>">
									<div class='faq__question'>
										<?php echo esc_html( get_the_title() ); ?>
										<div class='faq__expander'></div>
									</div>
									<div class='faq__answer post-content'>
										<?php the_content(); ?>
									</div>
								</div>
								<?php
							endwhile;
							wp_reset_postdata();
						} else {
							echo esc_html__( 'No FAQ items found in category', 'campeasy' );
						}
						?>
					</div>
				</div>
			<?php endforeach; ?>

			<?php if ( shortcode_exists( 'gravityform' ) && ! $is_simplified ) : ?>
				<div class="faq__group" id="faq-form">
					<div class="faq__heading"></div>
					<div class="faq__items">
						<?php echo do_shortcode( '[gravityform id="3" title="false" description="true" ajax="true"]' ); ?>
					</div>
				</div>
			<?php endif; ?>
		</div>
	</div>
</div>

<?php if ( ! $is_simplified ) : ?>
	<nav class="filters-nav faq-nav visible-lg-up">
		<div class="filters-nav__item js-offcanvas-open" data-offcanvas="offcanvas-faq-topics">
			<span class="icon-circle"><i class="icon icon--io-review"></i></span>
			<span class="icon__title"><?php esc_html_e( 'Topics', 'campeasy' ); ?></span>
		</div>
		<div class="filters-nav__group">
			<label class="filters-nav__item faq-nav__search">
					<span class="icon-circle">
						<i class="icon icon-search"></i>
					</span>
				<span class="icon__title"><?php esc_html_e( 'Search', 'campeasy' ); ?></span>
			</label>
		</div>
		<div class="filters-nav__group">
			<a href="#faq-form" class="faq-nav__link">
				<label class="campers-filters-nav__item faq-nav__search">
						<span class="icon-circle">
							<i class="icon icon--io-question"></i>
						</span>
					<span class="icon__title"><?php esc_html_e( 'Ask question', 'campeasy' ); ?></span>
				</label>
			</a>
		</div>
	</nav>

	<aside class="offcanvas campers-filters-side faq-side" id="offcanvas-faq-topics">
		<div class="offcanvas__overlay"></div>
		<div class="offcanvas__inner">
			<div class="btn-close js-offcanvas-close"><i class="icon icon--io-close-circle"></i></div>
			<div class="offcanvas__content">
				<section class="campers-filters-side__group">
					<h4 class="campers-filters-side__group-header">
						<i class="icon icon--io-review"></i>
						<?php echo esc_html_e( 'Topics', 'campeasy' ); ?>
					</h4>
				</section>
				<div class="filter-group--radio">
					<?php foreach ( $filtered_categories as $current_category ) : ?>
						<a href="#<?php echo esc_html( $current_category->slug ); ?>" class="js-offcanvas-close">
							<label>
								<?php echo esc_html( $current_category->name ); ?>
							</label>
						</a>
					<?php endforeach; ?>
				</div>
			</div>
		</div>
	</aside>
<?php endif; ?>

<?php if ( isset( $faq ) && is_iterable( $faq ) ) : ?>
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "FAQPage",
			"mainEntity": <?php echo wp_json_encode( $faq ); ?>
		}
	</script>
<?php endif; ?>
