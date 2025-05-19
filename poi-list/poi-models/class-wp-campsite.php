<?php
/**
 * Campsite model class.
 *
 * @package campeasy
 */

declare( strict_types=1 );

namespace Itm\model\entity\location\poi;

/**
 * Class Wp_Campsite
 *
 * @method string   get_address()
 * @method string   get_phone_number()
 * @method string   get_email()
 * @method string   get_website()
 * @method string   get_price_per_person()
 * @method bool     get_pet_friendly()
 * @method bool     get_wheelchair_accessible()
 * @method bool     get_playground()
 */
class Wp_Campsite extends Wp_Poi_Base {

	/**
	 * Array of pricing field keys and their corresponding output keys.
	 *
	 * @var array<string,string>
	 */
	protected array $pricing_fields = [
		'price_per_person' => 'per_person',
		'price_per_vehicle' => 'per_vehicle',
		'price_per_unit' => 'per_unit',
		'adult_night' => 'adult_night',
		'child_night' => 'child_night',
		'teen_night' => 'teen_night',
		'elderly_night' => 'elderly_night',
		'accommodation_tax' => 'accommodation_tax',
		'shower_cost' => 'shower_cost',
		'washer_price' => 'washer_price',
		'dryer_price' => 'dryer_price'
	];

	/**
	 * Constructor.
	 */
	private function __construct(int $post_id) {
		$this->string_fields = array_merge(
			$this->string_fields,
			[
				'address', 'phone_number', 'email', 'website',
				'price_per_person', 'shower_cost', 'washer_price', 'dryer_price',
				'in_the_area', 'other_services', 'notes'
			]
		);

		$this->bool_fields = [
			'pet_friendly', 'wheelchair_accessible', 'playground'
		];

		$this->facilities = [
			'pet_friendly', 'wheelchair_accessible', 'playground',
			'electricity', 'shower', 'washer', 'dryer'
		];

		// Call parent constructor
		parent::__construct($post_id);

		// Set default values specific to campsite
		$this->default_values = array_merge(
			$this->default_values,
			[
				'address' => '',
				'phone_number' => '',
				'email' => '',
				'website' => '',
				'price_per_person' => '',
				'pet_friendly' => false,
				'wheelchair_accessible' => false,
				'playground' => false,
			]
		);
	}

	/**
	 * Get facilities with their status for this campsite.
	 * Overrides the parent method to add additional derived facilities.
	 *
	 * @return array<string,bool>
	 */
	public function get_facilities(): array {
		$facilities = parent::get_facilities();

		$facilities['shower'] = !empty($this->values['shower_cost']);
		$facilities['washer'] = !empty($this->values['washer_price']);
		$facilities['dryer'] = !empty($this->values['dryer_price']);
		$facilities['electricity'] = !empty($this->values['electricity']);

		return $facilities;
	}

	/**
	 * Get pricing information.
	 *
	 * @return array<string,string>
	 */
	public function get_pricing(): array {
		$pricing = [];

		foreach ($this->pricing_fields as $field_key => $output_key) {
			if (!empty($this->values[$field_key])) {
				$pricing[$output_key] = $this->values[$field_key];
			}
		}

		return $pricing;
	}

	public static function get(int $post_id): self {
		$item = new self($post_id);
		$item->load_acf_fields();
		return $item;
	}

}
