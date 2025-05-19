<?php
/**
 * Hot Spring model class.
 *
 * @package campeasy
 */

declare( strict_types=1 );

namespace Itm\model\entity\location\poi;

/**
 * Class Wp_Hotspring
 *
 * @method string   get_address()
 * @method string   get_temperature()
 * @method string   get_price()
 * @method string   get_website()
 * @method bool     get_changing_rooms()
 * @method bool     get_artificial()
 */
class Wp_Hotspring extends Wp_Poi_Base {

	/**
	 * Constructor.
	 */
	private function __construct(int $post_id) {
		// Define hot spring specific fields before parent constructor
		$this->string_fields = array_merge(
			$this->string_fields,
			[
				'address', 'temperature', 'price', 'website',
				'phone_number', 'email', 'depth'
			]
		);

		$this->bool_fields = [
			'changing_rooms', 'artificial', 'shower', 'washing_machine',
			'indoor_cooking', 'electricity'
		];

		// Define hot spring specific facilities
		$this->facilities = [
			'changing_rooms', 'shower', 'washing_machine',
			'indoor_cooking', 'electricity'
		];

		// Call parent constructor
		parent::__construct($post_id);

		// Set default values specific to hot spring
		$this->default_values = array_merge(
			$this->default_values,
			[
				'address' => '',
				'temperature' => '',
				'price' => '',
				'website' => '',
				'depth' => '',
				'changing_rooms' => false,
				'artificial' => false,
				'shower' => false,
				'washing_machine' => false,
				'indoor_cooking' => false,
				'electricity' => false,
			]
		);
	}

	/**
	 * Array of water property field keys and their output keys.
	 *
	 * @var array<string,string>
	 */
	protected array $water_property_fields = [
		'temperature' => 'temperature',
		'depth' => 'depth',
		'minerals' => 'minerals'
	];

	/**
	 * Array of boolean water property fields.
	 *
	 * @var array<string>
	 */
	protected array $water_property_bool_fields = [
		'artificial'
	];

	/**
	 * Get water properties.
	 *
	 * @return array<string,string|bool>
	 */
	public function get_water_properties(): array {
		$properties = [];

		foreach ($this->water_property_fields as $field_key => $output_key) {
			if (!empty($this->values[$field_key])) {
				$properties[$output_key] = $this->values[$field_key];
			}
		}

		foreach ($this->water_property_bool_fields as $field) {
			if (isset($this->values[$field])) {
				$properties[$field] = filter_var($this->values[$field], FILTER_VALIDATE_BOOLEAN);
			}
		}

		return $properties;
	}

	public static function get(int $post_id): self {
		$item = new self($post_id);
		$item->load_acf_fields();
		return $item;
	}
}
