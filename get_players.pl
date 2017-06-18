use Player;
use Data::Dumper;
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

my $data = &get_database("data");
my $events = $data->{events} || {};
my $players = {};
while(<>) {
    chomp;
    my ($l, $f, $e, @dp) = split;
    my $pl = Player->new();
    $l =~ s/,$//;
    $pl->Name("$f $l");
    $pl->Email($e);
    $pl->Phone(join(" ", @dp));
    $pl->Team("Polar Bears");
    $players->{$pl->Name()} = $pl;
}
print Dumper($players);
write_database("data", $players, $events);
