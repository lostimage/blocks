<?php
/**
 * F-Road model class.
 *
 * @package campeasy
 */

declare( strict_types=1 );

namespace Itm\model\entity\location\poi;

/**
 * Class Wp_Froad
 *
 * @method string   get_distance()
 * @method string   get_duration()
 * @method string   get_difficulty()
 * @method string   get_river_count()
 * @method string   get_obstacles()
 * @method string   get_special_status()
 */
class Wp_Froad extends Wp_Poi_Base {

	/**
	 * Constructor.
	 */
	private function __construct(int $post_id) {
		// Define F-road specific fields before parent constructor
		$this->string_fields = array_merge(
			$this->string_fields,
			[
				'distance', 'duration', 'difficulty', 'river_count',
				'obstacles', 'special_status', 'road_number', 'recommended_vehicles'
			]
		);

		$this->bool_fields = [
			'requires_4x4', 'requires_high_clearance'
		];

		// Define F-road specific facilities/requirements
		$this->facilities = [
			'requires_4x4', 'requires_high_clearance'
		];

		// Call parent constructor
		parent::__construct($post_id);

		// Set default values specific to F-road
		$this->default_values = array_merge(
			$this->default_values,
			[
				'distance' => '',
				'duration' => '',
				'difficulty' => '',
				'river_count' => '',
				'obstacles' => '',
				'special_status' => '',
				'requires_4x4' => false,
				'requires_high_clearance' => false,
			]
		);
	}

	/**
	 * Array of F-road specification field keys and their output keys.
	 *
	 * @var array<string,string>
	 */
	protected array $specification_fields = [
		'distance' => 'distance',
		'duration' => 'duration',
		'difficulty' => 'difficulty',
		'obstacles' => 'obstacles',
		'road_number' => 'road_number'
	];

	/**
	 * Array of numeric specification fields that should be converted to integers.
	 *
	 * @var array<string>
	 */
	protected array $integer_spec_fields = [
		'river_count'
	];

	/**
	 * Get F-road specifications.
	 *
	 * @return array<string,string|int|bool>
	 */
	public function get_specifications(): array {
		$specs = [];

		foreach ($this->specification_fields as $field_key => $output_key) {
			if (!empty($this->values[$field_key])) {
				$specs[$output_key] = $this->values[$field_key];
			}
		}

		foreach ($this->integer_spec_fields as $field) {
			if (!empty($this->values[$field])) {
				$specs[$field] = intval($this->values[$field]);
			}
		}

		$facilities = $this->get_facilities();
		foreach ($facilities as $key => $value) {
			$specs[$key] = $value;
		}

		return $specs;
	}

	/**
	 * Get status of the F-road (open, closed, forbidden)
	 *
	 * @return string
	 */
	public function get_status(): string {
		if (!empty($this->values['special_status'])) {
			return strtolower($this->values['special_status']);
		}

		// Otherwise check regular open/closed status
		$is_open = $this->is_open();

		if ($is_open === true) {
			return 'open';
		} elseif ($is_open === false) {
			return 'closed';
		}

		return 'unknown';
	}

	public static function get(int $post_id): self {
		$item = new self($post_id);
		$item->load_acf_fields();
		return $item;
	}

}
