package variant

import (
	"github.com/gopherjs/gopherjs/js"

	"github.com/spamguy/godip/graph"
	"github.com/spamguy/godip/state"
)

type Variant struct {
	Name        string
	Start       func() (*state.State, error)
	BlankStart  func() (*state.State, error)
	Graph       *graph.Graph
	/*Blank       func(dip.Phase) *state.State                                                             `json:"-"`
	Phase       func(int, dip.Season, dip.PhaseType) dip.Phase                                           `json:"-"`
	ParseOrders func(map[dip.Nation]map[dip.Province][]string) (map[dip.Province]dip.Adjudicator, error) `json:"-"`
	ParseOrder  func([]string) (dip.Adjudicator, error)                                                  `json:"-"`
	Graph       dip.Graph
	Nations     []dip.Nation
	PhaseTypes  []dip.PhaseType
	Seasons     []dip.Season
	UnitTypes   []dip.UnitType
	OrderTypes  []dip.OrderType*/
}

// o -> variant object passed in by JavaScript
func New(o *js.Object) *Variant {
	return &Variant{
		Name: o.Get("name").String(),
		Graph: graph.New(o.Get("regions").Interface().(js.S)),
	}
}
