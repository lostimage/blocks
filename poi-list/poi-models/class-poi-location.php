<?php
/**
 * POI Location entity class.
 *
 * @package campeasy
 * @subpackage campeasy/includes
 */

declare( strict_types=1 );

namespace Itm\model\entity\location\poi;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\HasLifecycleCallbacks;
use Doctrine\ORM\Mapping\Table;
use Itm\Kernel\App;
use Itm\Model\Repository\POI_Locations_Repository;
use Itm\Request\Camper_Request;

#[ORM\Entity(repositoryClass: POI_Locations_Repository::class)]
#[Table(name: WPDB_PREFIX.'poi_locations')]
#[HasLifecycleCallbacks]
class POI_Location {

	#[ORM\Id]
	#[ORM\GeneratedValue]
	#[ORM\Column(type: Types::BIGINT, nullable: false, options: ['unsigned' => true])]
	private int $id;

	#[ORM\Column(type: Types::BIGINT, nullable: false, options: ['unsigned' => true])]
	private int $post_id;

	#[ORM\Column(type: Types::STRING, length: 50, nullable: false)]
	private string $post_type;

	#[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 8, nullable: false)]
	private float $lat = 0.0;

	#[ORM\Column(type: Types::DECIMAL, precision: 11, scale: 8, nullable: false)]
	private float $lng = 0.0;

	#[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: false, options: ['default' => 'CURRENT_TIMESTAMP'])]
	private \DateTimeInterface $created_at;

	#[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: false, options: ['default' => 'CURRENT_TIMESTAMP'])]
	private \DateTimeInterface $updated_at;

	/**
	 * Configuration for facility display.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private array $facility_config = [
		'electricity' => [
			'icon' => 'icon-electricity',
			'label' => 'Electricity'
		],
		'shower' => [
			'icon' => 'icon-shower',
			'label' => 'Shower'
		],
		'washer' => [
			'icon' => 'icon-washing-machine',
			'label' => 'Washing machine'
		],
		'indoor_cooking' => [
			'icon' => 'icon-indoor-cooking-facilities',
			'label' => 'Indoor cooking'
		],
		'pet_friendly' => [
			'icon' => 'icon-pet',
			'label' => 'Pet Friendly',
			'post_types' => ['campsites']
		],
		'wheelchair_accessible' => [
			'icon' => 'icon-wheelchair',
			'label' => 'Accessible',
			'post_types' => ['campsites']
		],
		'changing_rooms' => [
			'icon' => 'icon--io-changing-room',
			'label' => 'Changing rooms',
			'post_types' => ['hot-springs']
		]
	];

	/**
	 * Configuration for F-road specifications display.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private array $froad_spec_config = [
		'distance' => [
			'icon' => 'icon--io-distance',
			'label' => 'Distance:',
			'suffix' => ' Km'
		],
		'duration' => [
			'icon' => 'icon--io-duration',
			'label' => 'Duration:'
		],
		'difficulty' => [
			'icon' => 'icon--io-difficulty',
			'label' => 'Difficulty:'
		],
		'river_count' => [
			'icon' => 'icon--io-river',
			'label' => 'Rivers:'
		],
		'obstacles' => [
			'icon' => 'icon--io-obstacle',
			'label' => 'Main obstacle:'
		]
	];

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->created_at = new \DateTimeImmutable();
		$this->updated_at = new \DateTimeImmutable();
	}

	/**
	 * Get id.
	 *
	 * @return int
	 */
	public function get_id(): int {
		return $this->id;
	}

	/**
	 * Get post ID.
	 *
	 * @return int
	 */
	public function get_post_id(): int {
		return $this->post_id;
	}

	/**
	 * Set post ID.
	 *
	 * @param int $post_id Post ID.
	 * @return self
	 */
	public function set_post_id( int $post_id ): self {
		$this->post_id = $post_id;
		return $this;
	}

	/**
	 * Get post type.
	 *
	 * @return string
	 */
	public function get_post_type(): string {
		return $this->post_type;
	}

	/**
	 * Set post type.
	 *
	 * @param string $post_type Post type.
	 * @return self
	 */
	public function set_post_type( string $post_type ): self {
		$this->post_type = $post_type;
		return $this;
	}

	/**
	 * Get latitude.
	 *
	 * @return float
	 */
	public function get_lat(): float {
		return $this->lat;
	}

	/**
	 * Set latitude.
	 *
	 * @param float $lat Latitude.
	 * @return self
	 */
	public function set_lat( float $lat ): self {
		$this->lat = $lat;
		return $this;
	}

	/**
	 * Get longitude.
	 *
	 * @return float
	 */
	public function get_lng(): float {
		return $this->lng;
	}

	/**
	 * Set longitude.
	 *
	 * @param float $lng Longitude.
	 * @return self
	 */
	public function set_lng( float $lng ): self {
		$this->lng = $lng;
		return $this;
	}

	/**
	 * Get created at.
	 *
	 * @return \DateTimeInterface
	 */
	public function get_created_at(): \DateTimeInterface {
		return $this->created_at;
	}

	/**
	 * Get updated at.
	 *
	 * @return \DateTimeInterface
	 */
	public function get_updated_at(): \DateTimeInterface {
		return $this->updated_at;
	}

	/**
	 * Set updated at.
	 *
	 * @param \DateTimeInterface $updated_at Updated at.
	 * @return self
	 */
	public function set_updated_at( \DateTimeInterface $updated_at ): self {
		$this->updated_at = $updated_at;
		return $this;
	}

	/**
	 * Get facility display data for rendering.
	 *
	 * @return array<int, array<string, string>> Array of facility display data
	 */
	public function get_facility_display_data(): array {
		$poi = $this->get_poi_object();
		if (!$poi) {
			return [];
		}

		$facilities = $poi->get_facilities();
		$facility_display = [];

		// Add configured facilities that are available
		foreach ($this->facility_config as $key => $config) {
			// Skip if this facility is limited to specific post types and current post type isn't included
			if (isset($config['post_types']) && !in_array($this->post_type, $config['post_types'])) {
				continue;
			}

			// Add facility if it's enabled
			if (isset($facilities[$key]) && $facilities[$key]) {
				$facility_display[] = [
					'icon' => $config['icon'],
					'label' => __($config['label'], 'campeasy')
				];
			}
		}

		// Add temperature for hot springs (special case as it's not a boolean facility)
		if ($this->post_type === 'hot-springs' && $poi instanceof Wp_Hotspring) {
			$water_properties = $poi->get_water_properties();

			if (isset($water_properties['temperature']) && !empty($water_properties['temperature'])) {
				$facility_display[] = [
					'icon' => 'icon--io-temperature',
					'label' => $water_properties['temperature'] . '°C',
					'no_translation' => true
				];
			}
		}

		return $facility_display;
	}

	/**
	 * Get the appropriate detail template block based on POI type.
	 *
	 * @return string The template block name ('amenities' or 'specs')
	 */
	public function get_detail_template_type(): string {
		if ($this->post_type === 'f-roads') {
			return 'specs';
		}
		return 'amenities';
	}

	/**
	 * Renders the details section for this POI.
	 *
	 * @return void
	 */
	public function render_details(): void {
		$detail_type = $this->get_detail_template_type();

		if ($detail_type === 'amenities') {
			echo '<div class="itm-card__amenities">';
			$facilities_display = $this->get_facility_display_data();
			foreach ($facilities_display as $facility) {
				echo '<div class="itm-card__amenity">';
				echo '<i class="icon ' . esc_attr($facility['icon']) . '"></i>';
				echo '<span>' . (isset($facility['no_translation']) && $facility['no_translation'] ? esc_html($facility['label']) : esc_html($facility['label'])) . '</span>';
				echo '</div>';
			}
			echo '</div>';
		} else if ($detail_type === 'specs') {
			echo '<div class="itm-card__specs">';
			$specs_display = $this->get_froad_specs_display();
			foreach ($specs_display as $spec) {
				echo '<div class="itm-card__spec">';
				echo '<i class="icon ' . esc_attr($spec['icon']) . '"></i>';
				echo '<span>' . esc_html($spec['label']) . '</span>';
				echo '<strong>' . esc_html($spec['value']) . '</strong>';
				echo '</div>';
			}
			echo '</div>';
		}
	}

	/**
	 * Get POI object based on post type.
	 *
	 * @return Wp_Poi_Base|null POI object or null
	 */
	public function get_poi_object(): ?Wp_Poi_Base {
		switch ($this->post_type) {
			case 'campsites':
				return Wp_Campsite::get($this->post_id);
			case 'f-roads':
				return Wp_Froad::get($this->post_id);
			case 'hot-springs':
				return Wp_Hotspring::get($this->post_id);
			default:
				return null;
		}
	}


	/**
	 * Get render data for POI item.
	 *
	 * @param Camper_Request $camper_request The camper request object
	 * @return array<string, mixed> Render data
	 */
	public function get_render_data(Camper_Request $camper_request): array {
		$poi = $this->get_poi_object();
		if (!$poi) {
			return [];
		}

		$render_data = $this->get_common_render_data($poi, $camper_request);

		// Add type-specific data
		switch ($this->post_type) {
			case 'campsites':
				$render_data = $this->get_campsite_render_data($render_data, $poi, $camper_request);
				break;
			case 'f-roads':
				$render_data = $this->get_froad_render_data($render_data, $poi, $camper_request);
				break;
			case 'hot-springs':
				$render_data = $this->get_hotspring_render_data($render_data, $poi, $camper_request);
				break;
		}

		return $render_data;
	}

	/**
	 * Get common render data for all POI types.
	 *
	 * @param Wp_Poi_Base $poi The POI object
	 * @param Camper_Request $camper_request The camper request object
	 * @return array<string, mixed> Common render data
	 */
	private function get_common_render_data(Wp_Poi_Base $poi, Camper_Request $camper_request): array {
		$region = wp_get_post_terms($poi->get_wp_post_id(), 'region');
		$is_open = $poi->is_open_for_camper_dates($camper_request);
		$status = $is_open === true ? 'open' : ($is_open === false ? 'closed' : 'unknown');
		$status_label = $is_open === true ? __('Open', 'campeasy') : ($is_open === false ? __('Closed', 'campeasy') : '');

		$_link_class = "";
		if ($poi->get_comments()->count() > 0) {
			$_link_class = " has-reviews";
		}

		$data_facilities_attr = '';
		if ($this->post_type === 'campsites') {
			$facilities = $poi->get_available_facilities();
			if (!empty($facilities)) {
				$data_facilities_attr = json_encode($facilities);
			}
		}

		return [
			'post_id' => $this->post_id,
			'post_type' => $this->post_type,
			'title' => get_the_title($this->post_id),
			'region_name' => !empty($region) ? $region[0]->name : '',
			'region_slug' => !empty($region) ? $region[0]->slug : '',
			'operating_dates' => $poi->get_operating_dates(),
			'rating' => $poi->get_comments_overall_rating(),
			'rating_formatted' => $poi->get_comments_overall_rating_formatted(),
			'rating_percent' => $poi->get_comments_overall_rating_percent(),
			'reviews_count' => $poi->get_comments_count(),
			'reviews_text' => $poi->get_comments_count_printable(),
			'link_class' => $_link_class,
			'is_open' => $is_open,
			'status' => $status,
			'status_label' => $status_label,
			'title_icons' => $poi->get_title_icons(),
			'permalink' => get_permalink($this->post_id),
			'has_thumbnail' => has_post_thumbnail($this->post_id),
			'thumbnail' => get_the_post_thumbnail_url($this->post_id, 'medium_large'),
			'facilities' => $poi->get_facilities(),
			'available_facilities' => $poi->get_available_facilities(),
			'data_facilities_attr' => $data_facilities_attr,
			'lat' => $this->lat,
			'lng' => $this->lng,
			'camper_dates' => $camper_request->get_printable_date_interval()
		];
	}

	/**
	 * Get Campsite specific render data.
	 *
	 * @param array<string, mixed> $render_data Base render data
	 * @param Wp_Poi_Base $poi The POI object (should be Wp_Campsite)
	 * @param Camper_Request $camper_request The camper request object
	 * @return array<string, mixed> Complete render data
	 */
	private function get_campsite_render_data(array $render_data, Wp_Poi_Base $poi, Camper_Request $camper_request): array {
		if (!$poi instanceof Wp_Campsite) {
			return $render_data;
		}

		// Get all the basic string fields using magic getter methods
		$render_data['address'] = $poi->get_address();
		$render_data['website'] = $poi->get_website();
		$render_data['phone_number'] = $poi->get_phone_number();
		$render_data['email'] = $poi->get_email();

		// Format the price display
		$render_data['price'] = $poi->get_price_per_person() ? $poi->get_price_per_person() . ' ISK' : __('Free', 'campeasy');

		// Get all pricing information at once
		$render_data['pricing'] = $poi->get_pricing();

		// Get additional text fields
		$render_data['notes'] = $poi->get_direct_acf_field('notes');
		$render_data['in_the_area'] = $poi->get_direct_acf_field('in_the_area');
		$render_data['other_services'] = $poi->get_direct_acf_field('other_services');

		return $render_data;
	}

	/**
	 * Get F-Road specific render data.
	 *
	 * @param array<string, mixed> $render_data Base render data
	 * @param Wp_Poi_Base $poi The POI object (should be Wp_Froad)
	 * @param Camper_Request $camper_request The camper request object
	 * @return array<string, mixed> Complete render data
	 */
	private function get_froad_render_data(array $render_data, Wp_Poi_Base $poi, Camper_Request $camper_request): array {
		if (!$poi instanceof Wp_Froad) {
			return $render_data;
		}

		$specs = $poi->get_specifications();
		$render_data['status'] = $poi->get_status();
		$render_data['status_label'] = match ($render_data['status']) {
			'open' => __('Open', 'campeasy'),
			'closed' => __('Closed', 'campeasy'),
			'forbidden' => __('Forbidden', 'campeasy'),
			default => '',
		};
		$render_data['distance'] = $specs['distance'] ?? '';
		$render_data['duration'] = $specs['duration'] ?? '';
		$render_data['difficulty'] = $specs['difficulty'] ?? '';
		$render_data['river_count'] = $specs['river_count'] ?? '';
		$render_data['obstacles'] = $specs['obstacles'] ?? '';
		$render_data['road_number'] = $specs['road_number'] ?? '';
		$render_data['requires_4x4'] = $specs['requires_4x4'] ?? false;
		$render_data['requires_high_clearance'] = $specs['requires_high_clearance'] ?? false;

		return $render_data;
	}

	/**
	 * Get Hot Spring specific render data.
	 *
	 * @param array<string, mixed> $render_data Base render data
	 * @param Wp_Poi_Base $poi The POI object (should be Wp_Hotspring)
	 * @param Camper_Request $camper_request The camper request object
	 * @return array<string, mixed> Complete render data
	 */
	private function get_hotspring_render_data(array $render_data, Wp_Poi_Base $poi, Camper_Request $camper_request): array {
		if (!$poi instanceof Wp_Hotspring) {
			return $render_data;
		}

		// Get basic fields using magic getter methods
		$render_data['address'] = $poi->get_address();
		$render_data['website'] = $poi->get_website();

		// Format the price display
		$render_data['price'] = $poi->get_price() ? $poi->get_price() . ' ISK' : __('Free', 'campeasy');

		// Get all water properties at once
		$render_data['water_properties'] = $poi->get_water_properties();

		// Get contact information
		$render_data['phone_number'] = $poi->get_direct_acf_field('phone_number');
		$render_data['email'] = $poi->get_direct_acf_field('email');

		return $render_data;
	}

	/**
	 * Create a POI_Location renderer for a given post ID and type.
	 *
	 * @param int $post_id The post ID
	 * @param string $post_type The post type
	 * @return self
	 */
	public static function create_for_post(int $post_id, string $post_type): self {
		$poi_location = new self();
		$poi_location->set_post_id($post_id);
		$poi_location->set_post_type($post_type);

		try {
			$poi_location_repository = App::get()->get_container()->get(POI_Locations_Repository::class);
			if ($poi_location_repository) {
				$stored_location = $poi_location_repository->findOneBy([
					'post_id' => $post_id,
					'post_type' => $post_type
				]);

				if ($stored_location) {
					$poi_location->lat = $stored_location->get_lat();
					$poi_location->lng = $stored_location->get_lng();
				}
			}
		} catch (\Exception $e) {
			// Silently handle the exception
		}

		return $poi_location;
	}
}
