use MyEvent;
use Player;
use Data::Dumper;

my $data = &get_database("data");
my $events = $data->{events};
my $players = $data->{players};
my @p = @ARGV;

my @d;
foreach my $pl (@p) {
push @d, grep { $_ =~ /$pl/i } keys %$players;
}
print join("\n", @d), "\n";
my $foo = <STDIN>;
delete $players->{$_} foreach @d;
foreach my $e (keys %$events) {
    @evs = @{$events->{$e}};
    for my $ev (@evs) {
	for my $pl (@d) {
	    if (grep { $_ eq $pl } $ev->Who) {
		print "Removing $pl from ". $ev->Description() . "\n";
		$ev->RemovePlayer($pl);
		if (scalar $ev->Who() == 0) {
		    print "Removing event ". $ev->Description() . "\n";
		    delete $events{$ev};
		    my @res = grep { $_ ne $ev } @{$events->{$ev->Date()}};
		    if (scalar @res) {
			$events->{$ev->Date()} = \@res;
		    } else { 
			print "Removing date ". $ev->Date() . "\n";
			delete $events->{$ev->Date()};
		    }
		}

	    }
	}
    }
}
&write_database("data", $players, $events);

sub get_database {
	my $ffdb;
	my ($fname) = @_;
	open(IN, $fname);
	flock(IN, 1);
	# read in whole file
	my $tmp = $/;
	undef $/;
	my $l = <IN>;
	eval $l;
	close(IN);
	$/ = $tmp;
	return $ffdb;
}

sub write_database {
	my ($fname, $peeps, $evs) = @_;
  my $t = { events => $evs,
            players => $peeps
            };

	$Data::Dumper::Indent = 0;
	$Data::Dumper::Terse = 1;

	open(OUT, "+<".$fname);
	flock(OUT, 2);
	seek(OUT, 0, 0);
	truncate(OUT, 0);

	print OUT "\$ffdb = {\n";
	foreach (keys %{$t}) {
		my $esc = $_;
		$esc =~ s/'/\\'/g;
		print OUT "'$esc' => ";
		print OUT &Dumper($t->{$_});
		print OUT ",\n";
	}
	print OUT "};";
	close(OUT);
}
