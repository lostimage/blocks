<?php
/**
 * Template part for displaying POI items (Campsites, F-roads, Hot Springs)
 * Uses the POI model classes with Get_Comments trait for ratings
 *
 * @package campeasy
 */

// Enable strict typing mode.
declare( strict_types=1 );

// Disable direct access.
if ( ! defined( 'ABSPATH' ) ) {
	die;
}

use Itm\Kernel\App;
use Itm\model\entity\location\poi\POI_Location;
use Itm\Request\Camper_Request;

$post_type = $args['post_type'] ?? get_post_type();
$post_id   = get_the_ID();

// Create POI location renderer
$poi_location   = POI_Location::create_for_post( $post_id, $post_type );
$camper_request = App::get()->get_container()->get( Camper_Request::class );

// Get render data
$data = $poi_location->get_render_data( $camper_request );

// If no data, exit early
if ( empty( $data ) ) {
	return;
}

?>

<article class="itm-card js-poi-item <?php echo esc_attr( $data['post_type'] ); ?>-card"
         data-id="<?php echo esc_attr( $data['post_id'] ); ?>"
         data-region="<?php echo esc_attr( $data['region_slug'] ); ?>"
         data-facilities="<?php echo esc_attr( $data['data_facilities_attr'] ); ?>"
         data-lat="<?php echo esc_attr( $data['lat'] ); ?>"
         data-lng="<?php echo esc_attr( $data['lng'] ); ?>"
>
    <div class="itm-card__inner">
        <!-- Region tag -->
		<?php if ( ! empty( $data['region_name'] ) ) : ?>
            <div class="itm-card__tags">
                <div class="itm-card__tag btn btn-primary">
                    <span><?php echo esc_html( $data['region_name'] ); ?></span>
                </div>
            </div>
		<?php endif; ?>

        <!-- Reviews and Title section -->
        <div class="itm-card__header">
            <div class="itm-card__rating js-offcanvas-reviews-open"
                 data-post_id="<?php echo esc_attr( $data['post_id'] ); ?>"
                 data-offcanvas="offcanvas-reviews-<?php echo esc_attr( $data['post_id'] ); ?>">
                <span class="stars">
                    <i class="icon icon--io-stars"></i>
                    <i class="icon icon--io-stars active"
                       style="--rating-value: <?php echo esc_attr( $data['rating_percent'] ); ?>%;"></i>
                </span>
                <span class="rating__reviews <?php echo esc_attr( $data['link_class'] ); ?>"><?php echo esc_html( $data['reviews_text'] ); ?></span>
            </div>
            <div class="itm-card__header-title">
                <h3 class="itm-card__title">
                    <a href="<?php echo esc_url( $data['permalink'] ); ?>"><?php echo esc_html( $data['title'] ); ?></a>
                </h3>
				<?php if ( ! empty( $data['title_icons'] ) ) : ?>
                    <div class="itm-card__header-title-icons">
						<?php foreach ( $data['title_icons'] as $icon ) : ?>
                            <i class="icon <?php echo esc_attr( $icon['class'] ); ?>"
                               data-view="highlights"></i>
						<?php endforeach; ?>
                    </div>
				<?php endif; ?>
            </div>
            <!-- Operating dates -->
			<?php if ( ! empty( $data['operating_dates'] ) ) : ?>
                <div class="itm-card__status-part">
                    <div class="itm-card__status-line">
                        <div class="itm-card__dates">
                            <span><?php echo esc_html( $data['operating_dates'] ); ?></span>

							<?php if ( isset( $data['price'] ) ) : ?>
                                <span class="itm-card__price"><?php echo esc_html( $data['price'] ); ?></span>
							<?php endif; ?>
                        </div>
                    </div>

                    <!-- Status indicator -->
					<?php if ( isset( $data['status'] ) && $data['status'] !== 'unknown' && ! empty( $data['status_label'] ) ) : ?>
                        <div class="itm-card__status-line">
                            <span><?php echo esc_html( $data['camper_dates'] ); ?>:</span>
                            <span class="itm-card__status itm-card__status--<?php echo esc_attr( $data['status'] ); ?>"><?php echo esc_html( $data['status_label'] ); ?></span>
                        </div>
					<?php endif; ?>
                </div>
			<?php endif; ?>
        </div>

        <!-- Featured image -->
        <div class="itm-card__image">
			<?php if ( $data['has_thumbnail'] ) : ?>
				<?php echo get_the_post_thumbnail( $data['post_id'], 'medium_large', [ 'class' => 'itm-card__image-img' ] ); ?>
			<?php else : ?>
                <img src="<?php echo esc_url( get_template_directory_uri() . '/assets/img/poi-placeholder.jpg' ); ?>"
                     alt="<?php echo esc_attr( $data['title'] ); ?>" class="itm-card__image-img">
			<?php endif; ?>
        </div>

        <!-- POI specific details -->
        <div class="itm-card__details">
			<?php $poi_location->render_details(); ?>
        </div>


        <!-- Action buttons -->
        <div class="itm-card__actions">
            <div class="itm-card__buttons">
                <a href="<?php echo esc_url( $data['permalink'] ); ?>" class="btn btn-sm">
					<?php esc_html_e( 'Navigate', 'campeasy' ); ?>
                </a>

                <a href="<?php echo esc_url( $data['permalink'] ); ?>" class="btn btn-sm btn-outline">
					<?php esc_html_e( 'Discover', 'campeasy' ); ?>
                </a>

                <button class="btn btn-icon btn-sm btn-favorite btn-outline"
                        aria-label="<?php esc_attr_e( 'Add to favorites', 'campeasy' ); ?>">
                    <i class="icon icon--io-heart"></i>
                </button>
            </div>
        </div>
    </div>
</article>
